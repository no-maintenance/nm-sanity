import { AppointmentForm, ContactForm, NewsletterForm } from '~/components/form/form-variants';

interface FormBlockProps {
  formType: 'newsletter' | 'contact' | 'appointment';
  title?: string;
  description?: string;
}

export function FormBlock({ formType, title, description }: FormBlockProps) {
  const renderForm = () => {
    switch (formType) {
      case 'newsletter':
        return <NewsletterForm submitBtn="Subscribe" source="block" />;
      case 'contact':
        return <ContactForm submitBtn="Submit" />;
      case 'appointment':
        return <AppointmentForm submitBtn="Submit" />;
      default:
        return <span>Unknown Form Type</span>;
    }
  };

  return (
    <div className="my-8">
      {title && (
        <h3 className="mb-4 text-2xl font-semibold">{title}</h3>
      )}
      {description && (
        <p className="mb-6 text-muted-foreground">{description}</p>
      )}
      {renderForm()}
    </div>
  );
} 