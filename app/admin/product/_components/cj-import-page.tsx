"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Search, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  searchCjCatalog,
  importCjProduct,
} from "@/lib/cj/import";
import type { CjProductListItem } from "@/lib/cj/types";

export default function CjImportPage() {
  const [keyWord, setKeyWord] = useState("");
  const [markup, setMarkup] = useState(3);
  const [imported, setImported] = useState<Set<string>>(new Set());

  const search = useMutation({
    mutationFn: (kw: string) => searchCjCatalog({ keyWord: kw, size: 20 }),
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "CJ search failed"),
  });

  const doImport = useMutation({
    mutationFn: (pid: string) => importCjProduct(pid, { markup }),
    onSuccess: (res) => {
      setImported((prev) => new Set(prev).add(res.productId));
      toast.success(`Imported — ${res.variants} variant(s) created`);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  const results = search.data?.list ?? [];

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (keyWord.trim()) search.mutate(keyWord.trim());
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/product">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">CJ Dropshipping Import</h1>
          <p className="text-sm text-muted-foreground">
            Search the CJ catalog and import products into your store.
          </p>
        </div>
      </div>

      {/* Controls */}
      <form onSubmit={onSearch} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <Label htmlFor="cj-search" className="mb-1 block">
            Search CJ catalog
          </Label>
          <Input
            id="cj-search"
            placeholder="e.g. mug, hoodie, phone case"
            value={keyWord}
            onChange={(e) => setKeyWord(e.target.value)}
          />
        </div>
        <div className="w-32">
          <Label htmlFor="cj-markup" className="mb-1 block">
            Markup (×cost)
          </Label>
          <Input
            id="cj-markup"
            type="number"
            min={1}
            step={0.1}
            value={markup}
            onChange={(e) => setMarkup(Number(e.target.value) || 1)}
          />
        </div>
        <Button type="submit" disabled={search.isPending}>
          {search.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </Button>
      </form>

      {/* Results */}
      {search.isPending && (
        <p className="text-sm text-muted-foreground">Searching CJ…</p>
      )}
      {search.isSuccess && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No products found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {results.map((p: CjProductListItem) => {
          const isImported = imported.has(p.id);
          const importingThis =
            doImport.isPending && doImport.variables === p.id;
          return (
            <Card key={p.id} className="flex flex-col overflow-hidden">
              <CardHeader className="p-0">
                <div className="relative aspect-square bg-muted">
                  {p.bigImage ? (
                    <Image
                      src={p.bigImage}
                      alt={p.nameEn}
                      fill
                      sizes="(max-width:768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-3 space-y-2">
                <CardTitle className="text-sm font-medium line-clamp-2">
                  {p.nameEn}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">cost ${p.sellPrice ?? "?"}</Badge>
                  {p.warehouseInventoryNum != null && (
                    <span className="text-xs text-muted-foreground">
                      stock {p.warehouseInventoryNum}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Button
                  className="w-full"
                  size="sm"
                  disabled={isImported || importingThis}
                  onClick={() => doImport.mutate(p.id)}
                >
                  {importingThis ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isImported ? "Imported" : "Import"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
