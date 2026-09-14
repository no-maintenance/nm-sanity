import type {MetaFunction} from '@remix-run/react';
import {SignupExperience} from '~/components/signup/signup-experience';

// Preview variant of the signup landing — identical to /signup but with the
// rotating 3D cursor-following logo from the password-protected sale gate.
export const meta: MetaFunction = () => {
  return [{title: 'Sign Up (3D Logo) | No Maintenance'}];
};

export default function SignupParallax() {
  return <SignupExperience logo="logo3d" />;
}
