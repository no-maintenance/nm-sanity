import { Link } from "@remix-run/react";
import { useAnalytics } from "@shopify/hydrogen";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { InputWrapper } from "~/components/ui/input-with-wrapper";
import { toast } from "sonner"
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { KLAVIYO_BASE_URL, KLAVIYO_COMPANY_ID } from "~/sanity/constants";
import { Checkbox } from "~/components/ui/checkbox";

export const newsletterSchema = z.object({
    email: z
      .string({
        required_error: 'Please include an email for us to contact you.',
      })
      .email(),
    consent: z.boolean().refine((val) => val === true, {
      message: 'Please review and accept the terms and conditions to continue.',
    }),
  });
  export const getKlaviyoSubscriptionRequestData = (
    email: string,
    src?: string,
    id = 'Wimtnj',
  ) => ({
    type: 'subscription',
    attributes: {
      profile: {
        data: {
          type: 'profile',
          attributes: {
            subscriptions: {
              email: {
                marketing: {
                  consent: 'SUBSCRIBED',
                },
              },
            },
            email,
          },
        },
      },
      custom_source: src,
    },
    relationships: {
      list: {
        data: {
          type: 'list',
          id,
        },
      },
    },
  });
  
export function NewsletterForm({
    hasSubmitBtn = true,
    id,
    submitBtn,
    source,
  }: {
    submitBtn: string;
    hasSubmitBtn?: boolean;
    id?: string;
    source: string;
  }) {
    const {publish} = useAnalytics();
  
    const form = useForm<z.infer<typeof newsletterSchema>>({
      resolver: zodResolver(newsletterSchema),
      defaultValues: {
        email: '',
        consent: false,
      },
    });
    const isLoading = false;
  
    const onSubmit = (data: z.infer<typeof newsletterSchema>) => {
      const url = `${KLAVIYO_BASE_URL}/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`;
  
      const options = {
        method: 'POST',
        headers: {revision: '2025-01-15', 'content-type': 'application/json'},
        body: JSON.stringify({
          data: getKlaviyoSubscriptionRequestData(data.email, id),
        }),
      };
  
      fetch(url, options)
        .then((res) => {
          if (res.ok) {
            publish('custom_newsletter_signup', {source, data});
  
            form.reset();
            toast("You are now subscribed to our newsletter", {
              description: "We will keep you posted on upcoming promotions and releases",
            });
          } else {
            toast("Uh oh! Something went wrong", {
              description: "There was a problem with your request. Please try again later",
            });
          }
        })
        .catch((err) => {
          toast("Uh oh! Something went wrong", {
            description: "There was a problem with your request. Please try again later",
          });
          // @TODO add sentry error
          console.error('error:' + err);
        });
    };
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 lg:h-[122px] h-[111px]"
        >
          <FormField
            control={form.control}
            name="email"
            render={({field}) => (
              <FormItem>
                <FormControl>
                  <div className={'relative'}>
                    <InputWrapper
                      showErrorMsg={false}
                      id={'email'}
                      label={'Newsletter'}
                    >
                      <input
                        data-1p-ignore
                        id={'email'}
                        type="email"
                        placeholder="Enter your email address"
                        {...field}
                      />
                    </InputWrapper>
                    {hasSubmitBtn && (
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={
                          'absolute right-0 bottom-[3px] lg:pb-[6px] transform px-2 outline-offset-0'
                        }
                      >
                        {isLoading ? <p>Loading...</p> : submitBtn}
                      </button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="consent"
            render={({field}) => (
              <FormItem>
                <div className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-normal ">
                      I agree to receive the newsletter. See more about our{' '}
                      <Link
                        className={'underline'}
                        to={'/policies/privacy-policy'}
                      >
                        Privacy Policy
                      </Link>
                      .
                    </FormLabel>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    );
  }