import {useEffect, useRef, useState} from 'react';
import {Input} from '~/components/ui/input';
import {cn} from '~/lib/utils';

interface PasswordInputProps {
  name?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  error?: string;
  errorKey?: string | number;
  onError?: () => void;
}

export function PasswordInput({
  name = 'password',
  placeholder = 'Enter password',
  required = true,
  autoComplete = 'off',
  className,
  error,
  errorKey,
  onError,
}: PasswordInputProps) {
  const [shouldShake, setShouldShake] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const previousErrorRef = useRef<string | undefined>(undefined);
  const errorProcessedRef = useRef(false);

  // Reset error state when user starts typing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (hasError && e.target.value.length > 0) {
      setHasError(false);
      // Reset tracking so we can process new errors
      previousErrorRef.current = undefined;
      errorProcessedRef.current = false;
    }
  };

  useEffect(() => {
    // Process error if it exists and we haven't processed this specific error yet
    if (error) {
      // Check if this is a new error (different from previous or we haven't processed any error yet)
      if (error !== previousErrorRef.current || !errorProcessedRef.current) {
        previousErrorRef.current = error;
        errorProcessedRef.current = true;
        setHasError(true);
        setShouldShake(true);
        
        // Clear the input field
        setValue('');
        
        // Focus the input after clearing
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);

        // Call onError callback if provided
        onError?.();

        // Reset shake animation after it completes
        const timer = setTimeout(() => {
          setShouldShake(false);
        }, 500); // Match animation duration

        return () => clearTimeout(timer);
      }
    } else {
      // Reset when error is cleared
      previousErrorRef.current = undefined;
      errorProcessedRef.current = false;
      setHasError(false);
      setShouldShake(false);
    }
  }, [error, errorKey, onError]);

  return (
    <Input
      ref={inputRef}
      type="password"
      name={name}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      aria-invalid={hasError}
      className={cn(
        className,
        hasError && 'border-destructive bg-destructive/10 focus-visible:ring-destructive',
        shouldShake && 'animate-shake'
      )}
    />
  );
}
