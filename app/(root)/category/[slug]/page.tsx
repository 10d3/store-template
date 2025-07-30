import React from "react";

export default async function page({
  props,
}: {
  props: { params: Promise<{ slug: string }> };
}) {
  const params = await props.params;
  console.log(params.slug);

  return <div>page</div>;
}
