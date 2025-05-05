import type { FooterOfType, SectionDefaultProps } from 'types';
import { Link } from '@remix-run/react';
import { useColorsCssVars } from '~/hooks/use-colors-css-vars';
import { CountrySelector } from '../layout/country-selector';
import { SocialMediaButtons } from '../social-media';
import { useState } from 'react';
import { NewsletterForm } from '~/components/klaviyo/newsletter';

type FooterWithNavProps = FooterOfType<'footerWithNav'>;

export function FooterWithNav(
  props: SectionDefaultProps & { data: FooterWithNavProps },
) {
  const { data } = props;
  const colorsCssVars = useColorsCssVars({
    selector: '#country-selector',
    settings: data.settings,
  });

  const [email, setEmail] = useState('');
  const [checked, setChecked] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter submit logic would be implemented here
    console.log('Newsletter submitted with email:', email, 'and privacy consent:', checked);
    // Reset form after submission
    setEmail('');
    setChecked(false);
  };

  return (
    <footer className="bg-white">
      <section className="mt-16 mb-5 px-4">
        <style dangerouslySetInnerHTML={{ __html: colorsCssVars }} />
        <div className="mx-auto max-w-7xl mb-4 md:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Navigation links */}
            <div>
              <nav>
                <ul className="grid grid-cols-2 md:grid-cols-1 gap-4">
                  {data.menu?.map((item: any, index: number) => (
                    <li key={index} className="text-sm">
                      {item._type === 'internalLink' && item.link?.slug?.current && (
                        <Link to={`/${item.link.slug.current}`} className="hover:underline">
                          {item.name}
                        </Link>
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
          </div>

          {/* <div className="mt-16 flex flex-col items-center justify-center gap-5">
            <CountrySelector />
          </div> */}
        </div>
        <p className="mt-4 font-semibold text-xl  sm:text-3xl">{data.copyright || "© NO MAINTENANCE CORP. 2024"}</p>

      </section>


    </footer>
  );
}
