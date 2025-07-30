import React from "react";

export default async function page({
  props,
}: {
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ variant?: string; image?: string }>;
  };
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  console.log(params.slug, searchParams);

  return <div>page</div>;
}
