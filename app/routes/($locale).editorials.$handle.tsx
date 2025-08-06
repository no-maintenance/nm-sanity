import { useLoaderData } from "@remix-run/react";
export async function loader() {
    return {
      categories: []
    }
  }
  
export default function EditorialsIndex() {
  const { categories } = useLoaderData<typeof loader>();

  return <div>EditorialsIndex</div>;
}

