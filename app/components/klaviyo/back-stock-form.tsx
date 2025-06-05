import { cloneElement, ReactElement, ReactNode, useEffect, useRef, useState } from "react";
import { useFocus } from "~/hooks/use-focus";
import { InputWrapper } from "../ui/input-with-wrapper";
import { Link } from "@remix-run/react";
import { useAnalytics } from "@shopify/hydrogen";
import { toast } from "sonner";
import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import { KLAVIYO_COMPANY_ID } from "~/sanity/constants";
import { getKlaviyoSubscriptionRequestData } from "../form/form-variants";

export function KlaviyoBackInStock({
    source,
    variantId,
    cb,
}: {
    source: string;
    variantId: string;
    cb?: () => void;
}) {
    const { publish, shop, cart, prevCart } = useAnalytics();

    const formRef = useRef<HTMLFormElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string }>({});
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setErrors({});

        const formData = new FormData(event.currentTarget);
        const email = formData.get('email') as string;
        const consent = formData.get('consent') === 'on';

        try {
                    // Call Klaviyo client API for back-in-stock subscription
        const response = await fetch(`https://a.klaviyo.com/client/back-in-stock-subscriptions?company_id=${KLAVIYO_COMPANY_ID}`, {
          method: 'POST',
          headers: {
            accept: 'application/vnd.api+json',
            revision: '2025-04-15',
            'content-type': 'application/vnd.api+json'
          },
                body: JSON.stringify({
                    data: {
                        type: 'back-in-stock-subscription',
                        attributes: {
                            profile: {
                                data: {
                                    type: 'profile',
                                    attributes: {
                                        email: email,
                                    }
                                }
                            },
                            channels: ['EMAIL'],
                        },
                        relationships: {
                            variant: {
                                data: {
                                    type: 'catalog-variant',
                                    id: `$shopify:::$default:::${variantId}`,
                                },
                            },
                        },
                    },
                }),
            });

            if (response.ok) {
                // Klaviyo returns 202 with no response body for successful subscriptions
                let data = null;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        data = await response.json();
                    } catch (e) {
                        // No JSON content, which is expected for 202 responses
                        data = { success: true };
                    }
                } else {
                    data = { success: true };
                }

                // If user consented to marketing emails, subscribe them to newsletter
                if (consent) {
                    const options = {
                        method: 'POST',
                        headers: {revision: '2025-01-15', 'content-type': 'application/json'},
                        body: JSON.stringify({
                          data: getKlaviyoSubscriptionRequestData(email, 'Back in Stock Form'),
                        }),
                      };
                  
                    try {
                        await fetch(`https://a.klaviyo.com/client/subscriptions?company_id=${KLAVIYO_COMPANY_ID}`, options);
                    } catch (error) {
                        console.error('Failed to subscribe to newsletter:', error);
                        // Don't fail the main flow if newsletter subscription fails
                    }
                }

                // Publish analytics event
                publish('custom_back_in_stock', {
                    status: 'success',
                    data,
                    variantId,
                    source,
                    consent,
                });

                // Reset form and show success message
                formRef.current?.reset();
                toast('Back in stock notification enabled', {
                    description: 'You will be notified when this size is restocked.',
                });
                if (cb) cb();
            } else {
                let errorData: any = { errors: [{ detail: 'Failed to subscribe. Please try again.' }] };
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If we can't parse the error response, use default message
                }
                setErrors({
                    email: errorData.errors?.[0]?.detail || 'Failed to subscribe. Please try again.',
                });
            }
        } catch (error) {
            console.error('Back in stock subscription error:', error);
            setErrors({
                email: 'Failed to subscribe. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form ref={formRef} onSubmit={handleSubmit}>
            <div className={'relative'}>

                <input type={'hidden'} value={source} name={'source'} />
                <input type={'hidden'} value={variantId} name={'variantId'} />
                <div className={''}>
                    <InputWrapper
                        errorMsg={errors.email}
                        showErrorMsg={false}
                        fixedHeight={false}
                        id={'email'}
                    >
                        <input
                            data-1p-ignore
                            id={'email'}
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            required
                        />
                    </InputWrapper>
                </div>
                <div className={'text-left block pt-4'}>
                    <Checkbox
                        label={
                            <span className={'pl-2 cursor-pointer text-fine -mt-[2px]'}>
                                I would also like to opt-in to receive the newsletter. See our{' '}
                                <Link className={'underline'} to={'/policies/privacy-policy'}>
                                    Privacy Policy
                                </Link>{' '}
                                for more information.
                            </span>
                        }
                    >
                        <input
                            type="checkbox"
                            name="consent"
                            className={cn('bg-transparent')}
                        />
                    </Checkbox>
                </div>
            </div>
            {errors.email && <p className={'text-destructive text-sm mt-2'}>{errors.email}</p>}
            <Button className={'w-full mt-16'} type="submit" disabled={isLoading}>
                {isLoading ? <p>Submitting...</p> : 'Notify Me'}
            </Button>
        </form>
    );
}

function Checkbox({
    hasError,
    children,
    label,
}: {
    label: ReactNode;
    hasError?: string;
    children: ReactElement;
}) {
    const [checkboxRef, setFocus] = useFocus<HTMLInputElement>();
    useEffect(() => {
        if (hasError) setFocus();
    }, [hasError]);
    const input = cloneElement(children, {
        className: 'bg-transparent',
        ref: checkboxRef,
    });
    return (
        <label
            className={cn(hasError && 'text-destructive border-color-error')}
        >
            {input}
            {label}
        </label>
    );
}