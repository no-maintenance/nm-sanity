import { DialogContent, DialogTrigger, Dialog } from "~/components/ui/dialog";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Heading, Section, Text } from "~/components/primatives/text";
import { Drawer, DrawerTrigger, DrawerContent, DrawerClose } from "~/components/ui/drawer";
// import { ProductVariantSelector } from "~/components/product/product-variant-selector";
// import { KlaviyoBackInStock } from "~/components/klaviyo/klaviyo-back-in-stock";
import { Link } from "@remix-run/react";
import { VariantSelector } from "~/components/product/variant-selector";
import { useProduct } from "@shopify/hydrogen-react";
import { useProductVariants } from "~/components/sections/product-information-section";
import { useMediaQuery } from "~/hooks/use-media-query";
export function SoldOutButton() {
    // const isDesktop = useMediaQuery('(min-width: 768px)');
    const isDesktop = true;
    const {product} = useProduct();
    const variantsContextData = useProductVariants();
    const [open, setOpen] = useState(false);
    if (!product) return null;

    if (isDesktop) {
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            asChild
            className={'text-fine font-semibold cursor-pointer w-full'}
          >
            <Button variant={'outline'}>
              {t('product.soldOut')} — {t('product.notifyMe')}
            </Button>
          </DialogTrigger>
          <DialogContent variant={'tall'}>
            <div className={'p-6 flex flex-col gap-6'}>
              <section>
                <Heading as={'h2'} className={'uppercase font-medium text-lead'}>
                  NOTIFY ME WHEN BACK IN STOCK
                </Heading>
                <div>
                  <Text>
                    We will send you a notification when this product is back in
                    stock.
                  </Text>
                </div>
              </section>
              <Section padding={'y'} className={'flex-1'}>
                <div className={''}>
                  <Heading as={'h4'} size={'copy'} className={'mb-2'}>
                    {product.title}
                  </Heading>
                  <div className={'w-full'}>
                    <VariantSelector
                      options={product.options} variants={variantsContextData?.variants}
                    />
                  </div>
                </div>
                {/* <KlaviyoBackInStock
                  source={'popup'}
                  variantId={selectedVariant.id}
                  cb={() => setOpen(false)}
                /> */}
              </Section>
              <section>
                <Heading size={'copy'} className={'font-medium'}>
                  Log In
                </Heading>
                <Link to={`/account`} className={'underline'}>
                  Sign in
                </Link>{' '}
                to your account to request a return or ask a question
              </section>
            </div>
          </DialogContent>
        </Dialog>
      );
    }
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger
          asChild
          className={'text-fine font-semibold cursor-pointer w-full'}
        >
          <Button variant={'outline'}>
            {t('product.soldOut')} — {t('product.notifyMe')}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className={'p-6'}>
            <section>
              <Heading as={'h2'} className={'uppercase font-medium text-lead'}>
                NOTIFY ME WHEN BACK IN STOCK
              </Heading>
              <div>
                <Text>
                  We will send you a notification when this product is back in
                  stock.
                </Text>
              </div>
            </section>
            <Section padding={'y'}>
              <div className={'pb-6'}>
                <Heading as={'h4'} size={'copy'} className={'mb-2'}>
                  {product.title}
                </Heading>
                <div className={'w-full'}>
                  <VariantSelector
                      options={product.options} variants={variantsContextData?.variants}
                  />
                </div>
              </div>
              {/* <KlaviyoBackInStock
                source={'popup'}
                variantId={selectedVariant.id}
                cb={() => setOpen(false)}
              /> */}
              <DrawerClose asChild>
                <Button className={'w-full mt-4'} variant={'outline'}>
                  Cancel
                </Button>
              </DrawerClose>
            </Section>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }