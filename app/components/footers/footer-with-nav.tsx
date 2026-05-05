import type { FooterOfType, SectionDefaultProps } from 'types';
import { useAnalytics } from '@shopify/hydrogen';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useColorsCssVars } from '~/hooks/use-colors-css-vars';
import { CountrySelector } from '~/components/layout/country-selector';
import { IconArrowRight } from '~/components/icons/icon-arrow-right';
import { getKlaviyoSubscriptionRequestData } from '~/components/klaviyo/newsletter';
import { SanityInternalLink } from '~/components/sanity/link/sanity-internal-link';
import { KLAVIYO_BASE_URL, KLAVIYO_COMPANY_ID } from '~/sanity/constants';

type FooterWithNavProps = FooterOfType<'footerWithNav'>;

const inlineNewsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

function InlineNewsletter() {
  const { publish } = useAnalytics();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof inlineNewsletterSchema>>({
    resolver: zodResolver(inlineNewsletterSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: z.infer<typeof inlineNewsletterSchema>) => {
    setSubmitting(true);
    try {
      const url = `${KLAVIYO_BASE_URL}/client/subscriptions/?company_id=${KLAVIYO_COMPANY_ID}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { revision: '2025-01-15', 'content-type': 'application/json' },
        body: JSON.stringify({
          data: getKlaviyoSubscriptionRequestData(data.email, 'footer'),
        }),
      });
      if (res.ok) {
        publish('custom_newsletter_signup', { source: 'footer', data });
        reset();
        toast('Thanks for subscribing!');
      } else {
        toast('Uh oh! Something went wrong', {
          description: 'There was a problem with your request. Please try again later.',
        });
      }
    } catch {
      toast('Uh oh! Something went wrong', {
        description: 'There was a problem with your request. Please try again later.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-t border-foreground py-6"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
        <label
          className="text-sm uppercase tracking-wider whitespace-nowrap"
          htmlFor="footer-newsletter-email"
        >
          Subscribe to our newsletter
        </label>
        <div className="flex w-full items-center border-b border-foreground sm:max-w-xs">
          <input
            aria-label="Email address"
            autoComplete="email"
            className="flex-1 bg-transparent py-1 text-sm italic placeholder:italic placeholder:text-foreground/50 outline-none"
            id="footer-newsletter-email"
            placeholder="insert your email"
            style={{ fontSize: '16px' }}
            type="email"
            {...register('email')}
          />
          <button
            aria-label="Subscribe"
            className="px-2 py-1 hover:opacity-70 disabled:opacity-50"
            disabled={submitting}
            type="submit"
          >
            <IconArrowRight />
          </button>
        </div>
      </div>
      {errors.email?.message && (
        <p className="mx-auto mt-2 max-w-xl text-xs text-destructive sm:text-right">
          {errors.email.message}
        </p>
      )}
    </form>
  );
}

export function FooterWithNav(
  props: SectionDefaultProps & { data: FooterWithNavProps },
) {
  const { data } = props;
  const colorsCssVars = useColorsCssVars({
    selector: '#country-selector',
    settings: data.settings,
  });

  return (
    <footer className="bg-white container ">
      <section className="mt-16 mb-5 sm:px-4">
        <style dangerouslySetInnerHTML={{ __html: colorsCssVars }} />
        <div className="mx-auto mb-4 md:mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Navigation links */}
            <div>
              <nav>
                <ul className="grid grid-cols-2 md:grid-cols-1 gap-4">
                  {data.menu?.map((item: any, index: number) => (
                    <li key={index} className="text-sm md:text-left text-center">
                      {item._type === 'internalLink' && item.link?.slug?.current && (
                        <SanityInternalLink
                          data={item}
                        >
                          {item.name}
                        </SanityInternalLink>
                      )}
                      {item._type === 'externalLink' && item.link && (
                        <a
                          href={String(item.link)}
                          target={item.openInNewTab ? "_blank" : "_self"}
                          rel={item.openInNewTab ? "noopener noreferrer" : ""}
                          className="hover:underline"
                        >
                          {item.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="flex justify-center gap-2 ">
              <div className="flex justify-center items-center gap-2 flex-col">
                {data.showCountrySelector && (
                  <div className="flex  gap-5">
                    <CountrySelector />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <InlineNewsletter />

        <p className="mt-4 font-semibold text-lg text-center sm:text-3xl">{data.copyright || "© NO MAINTENANCE CORP. 2024"}</p>
      </section>
    </footer>
  );
}
