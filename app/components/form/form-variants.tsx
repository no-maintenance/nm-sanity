
import {zodResolver} from '@hookform/resolvers/zod';
import type {UseControllerProps} from 'react-hook-form';
import {useController, useForm} from 'react-hook-form';
import {z} from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {Input} from '../ui/input';
import {Button} from '~/components/ui/button';
import {Checkbox} from '~/components/ui/checkbox';
import {Link} from '@remix-run/react';
import React, {forwardRef, useEffect, useRef, useState} from 'react';
import {toast} from 'sonner';
import {
  EMAILJS_APPOINTMENT_TEMPLATE_ID,
  EMAILJS_CONTACT_TEMPLATE_ID,
  EMAILJS_PUBKEY,
  EMAILJS_SERVICE_ID,
  KLAVIYO_BASE_URL,
  KLAVIYO_COMPANY_ID,
} from '~/sanity/constants';

import emailjs from '@emailjs/browser';
import {useAnalytics} from '@shopify/hydrogen';
import { Textarea } from '~/components/ui/textarea';
import { InputWrapper } from '~/components/ui/input-with-wrapper';


const contactFormSchema = z.object({
  name: z.string({
    required_error: 'Please include a name for us to address you',
  }),
  contact: z
    .string({
      required_error: 'Please include an email for us to contact you.',
    })
    .email(),
  order_number: z.string(),
  subject: z.string(),
  message: z.string(),
});

export function ContactForm({submitBtn}: {submitBtn: string}) {
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      contact: '',
      order_number: '',
      subject: '',
      message: '',
    },
  });
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = () => {
    if (!formRef.current) return;
    emailjs
      .sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_CONTACT_TEMPLATE_ID,
        formRef.current,
        EMAILJS_PUBKEY,
      )
      .then(
        (result) => {
          form.reset();
          toast('Your support request has been submitted.', {
            description: 'We will review your issue and reply shortly',
          });
        },
        (error) => {
          console.error(error);
          toast('Uh oh! Something went wrong.', {
            description:
              'There was a problem with your request. Please try again later.',
          });
        },
      );
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({field}) => (
            <FormItem>
              <FormLabel>First, Last Name</FormLabel>
              <FormControl>
                <Input placeholder="First, Last Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact"
          render={({field}) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="order_number"
          render={({field}) => (
            <FormItem>
              <FormLabel>Order Number</FormLabel>
              <FormControl>
                <Input placeholder="#NM23814" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({field}) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="Subject" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({field}) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size={'lg'}>
          {submitBtn}
        </Button>
      </form>
    </Form>
  );
}

const appointmentFormSchema = z.object({
  name: z.string({
    required_error: 'Please include a name for us to address you',
  }),
  contact: z
    .string({
      required_error: 'Please include an email for us to contact you.',
    })
    .email(),
  phone: z.string(),
  unformatted_requested_time: z.string({
    required_error: 'A requested appointment time is required.',
  }),
  party_size: z.string({
    required_error:
      'Please include the party size. We can update this value later.',
  }),
  message: z.string(),
});

export function AppointmentForm({submitBtn}: {submitBtn: string}) {
  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: '',
      contact: '',
      phone: '',
      message: '',
      party_size: '',
      unformatted_requested_time: '',
    },
  });
  const formRef = useRef<HTMLFormElement>(null);
  const onSubmit = (values: z.infer<typeof appointmentFormSchema>) => {
    emailjs
      .sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_APPOINTMENT_TEMPLATE_ID,
        formRef.current!,
        EMAILJS_PUBKEY,
      )
      .then(
        (result) => {
          form.reset();
          toast('Your appointment request has been submitted.', {
            description:
              'We will review your request and confirm your appointment time shortly',
          });
        },
        (error) => {
          console.error(error);
          toast('Uh oh! Something went wrong.', {
            description:
              'There was a problem with your request. Please try again later.',
          });
        },
      );
  };

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 md:space-y-8"
      >
        <FormField
          control={form.control}
          name="name"
          render={({field}) => (
            <FormItem>
              <FormLabel>First, Last Name</FormLabel>
              <FormControl>
                <Input placeholder="First, Last Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact"
          render={({field}) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Your Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({field}) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="Your Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="party_size"
          render={({field}) => (
            <FormItem>
              <FormLabel>Party Size</FormLabel>
              <FormControl>
                <Input type={'string'} placeholder="3" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unformatted_requested_time"
          render={({field}) => (
            <FormItem className="flex flex-col">
              <FormLabel>Availability</FormLabel>
              <FormDescription>
                Please select a date and time for your appointment. We will send
                you a confirmation email once your appointment is booked.
              </FormDescription>
              <DateInput {...field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({field}) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className={'w-full'}>
          {submitBtn}
        </Button>
      </form>
    </Form>
  );
}

const DateInput = forwardRef<HTMLInputElement, UseControllerProps>(
  ({name, control}, ref) => {
    const {field} = useController({name, control});

    const [formattedTime, setFormattedTime] = useState('');
    const [minDateTime, setMinDateTime] = useState('');

    useEffect(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const formattedNow = `${year}-${month}-${day}T${hours}:${minutes}`;
      setMinDateTime(formattedNow);
    }, []);

    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const handleHiddenInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const selectedDate = e.target.value;
      const formattedDateTime = new Date(selectedDate).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
      setFormattedTime(formattedDateTime);
      field.onChange(selectedDate);
    };

    return (
      <>
        <Input
          className={'block'}
          min={minDateTime}
          type="datetime-local"
          {...field}
          value={field.value}
          onChange={handleHiddenInputChange}
          onClick={(e) => e.currentTarget.showPicker()}
        />
        <input type="hidden" name={'requested_time'} value={formattedTime} />
      </>
    );
  },
);
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
          // analytics.trackEvent(AnalyticsFormEvents.MainNewsletterSignup, {
          //   location: 'footer',
          //   componentID: '9c448a26-16bf-4011-ba0a-1d651eebd649',
          // });
          // setSubmissionState('success');
          publish('custom_newsletter_signup', {source, data});

          form.reset();
          toast('You are now subscribed to our newsletter.', {
            description:
              'We will keep you posted on upcoming promotions and releases.',
          });
        } else {
          toast('Uh oh! Something went wrong.', {
            description:
              'There was a problem with your request. Please try again later.',
          });
        }
      })
      .catch((err) => {
        toast('Uh oh! Something went wrong.', {
          description:
            'There was a problem with your request. Please try again later.',
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
                        'absolute right-0 bottom-0 py-2 lg:pb-[6px] transform px-2 outline-offset-0'
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
                  <FormLabel>
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

        {/*<button*/}
        {/*  type="submit"*/}
        {/*  disabled={isLoading}*/}
        {/*  className={' right-0 bottom-0 py-2 lg:pb-[6px] transform px-2'}*/}
        {/*>*/}
        {/*  {isLoading ? <p>Loading...</p> : 'Submit'}*/}
        {/*</button>*/}
      </form>
    </Form>
  );
}
