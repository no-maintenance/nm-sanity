import type { FooterOfType, SectionDefaultProps } from 'types';
import { Link } from '@remix-run/react';
import { useColorsCssVars } from '~/hooks/use-colors-css-vars';
import { CountrySelector } from '~/components/layout/country-selector';
import { NewsletterForm } from '~/components/klaviyo/newsletter';
import { SanityInternalLink } from '~/components/sanity/link/sanity-internal-link';

type FooterWithNavProps = FooterOfType<'footerWithNav'>;

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
              {/* Right side: Newsletter */}
              {data.showNewsletter && (
                <div className="sm:max-w-md md:max-w-sm w-full max-w-full">
                  <NewsletterForm
                    hasSubmitBtn={false}
                    id="footer-newsletter"
                    source="footer"
                    submitBtn="Subscribe"
                  />
                </div>
              )}  
              {data.showCountrySelector && (
                <div className="flex  gap-5">
                  <CountrySelector />
                </div>
              )}
              </div>
            </div>
          </div>

          
        </div>
        <p className="mt-4 font-semibold text-lg text-center sm:text-3xl">{data.copyright || "© NO MAINTENANCE CORP. 2024"}</p>

      </section>


    </footer>
  );
}
