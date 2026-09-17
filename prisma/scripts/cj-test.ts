/**
 * Script: cj-test.ts
 * Phase 0 connectivity check for the CJ Dropshipping API client.
 *
 * Verifies:
 *   1. Auth — fetches an access token with CJ_API_KEY.
 *   2. Catalog read — lists a couple of products.
 *   3. Product detail — fetches one product + its variants.
 *
 * Usage:
 *   CJ_API_KEY="CJUserNum@api@xxxx" bun prisma/scripts/cj-test.ts [keyWord]
 *
 * Make sure CJ_API_KEY is set in .env (or inline as above) before running.
 */

import { cj, queryCjProducts, getCjProduct, getCjVariants } from "../../lib/cj";

async function main() {
  const keyWord = process.argv[2] || "mug";

  console.log("\n🔌 CJ connectivity check\n");

  // 1. Auth
  const token = await cj.getAccessToken();
  console.log(`✅ Auth OK — access token: ${token.slice(0, 12)}…\n`);

  // 2. List
  const list = await queryCjProducts({ keyWord, size: 3 });
  console.log(`✅ listV2 OK — total=${list.total}, returned=${list.list?.length ?? 0}`);
  for (const p of list.list ?? []) {
    console.log(`   • ${p.id}  ${p.nameEn}  (${p.sellPrice ?? "?"})`);
  }
  console.log();

  // 3. Detail + variants for the first result
  const first = list.list?.[0];
  if (first) {
    const detail = await getCjProduct(first.id);
    console.log(`✅ query OK — ${detail.pid} "${detail.productNameEn}"`);
    const variants = await getCjVariants(first.id);
    console.log(`✅ variant/query OK — ${variants?.length ?? 0} variants`);
    for (const v of (variants ?? []).slice(0, 5)) {
      console.log(`   • ${v.vid}  ${v.variantKey ?? v.variantNameEn}  $${v.variantSellPrice ?? "?"}`);
    }
  } else {
    console.log("⚠️  No products returned for keyword — try a different one.");
  }

  console.log("\n🎉 CJ Phase 0 connectivity verified.\n");
}

main()
  .catch((err) => {
    console.error("\n❌ CJ connectivity check failed:\n", err);
    process.exit(1);
  });
