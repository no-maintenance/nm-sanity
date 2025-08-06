import { useLoaderData } from "@remix-run/react";

export default function EditorialsIndex() {
  const { categories } = useLoaderData<typeof loader>();

  return <div>EditorialsIndex</div>;
}

export async function loader() {
    return {
        categories: []
    }
}