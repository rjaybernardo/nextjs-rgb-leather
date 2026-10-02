"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  createTaxonomy,
  deleteTaxonomy,
  renameTaxonomy,
  type TaxonomyKind,
} from "@/lib/actions/taxonomy.actions";

type Item = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

type TaxonomyListProps = {
  kind: TaxonomyKind;
  title: string;
  items: Item[];
};

const TaxonomyList = ({ kind, title, items }: TaxonomyListProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const noun = kind === "category" ? "category" : "brand";

  function run(
    action: () => Promise<{ success: boolean; message: string }>,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();

      toast.add({
        type: result.success ? "success" : "error",
        description: result.message,
      });

      setConfirmDeleteId(null);

      if (result.success) {
        onSuccess?.();
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">
        {title}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({items.length})
        </span>
      </h2>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          run(() => createTaxonomy(kind, newName), () => setNewName(""));
        }}
      >
        <label htmlFor={`new-${kind}`} className="sr-only">
          New {noun} name
        </label>

        <Input
          id={`new-${kind}`}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder={kind === "category" ? "e.g. Wallets" : "e.g. RGB Leather"}
          maxLength={60}
          disabled={isPending}
        />

        <Button type="submit" disabled={isPending || newName.trim().length < 2}>
          Add
        </Button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {noun} yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
              {editingId === item.id ? (
                <form
                  className="flex flex-1 gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(
                      () => renameTaxonomy(kind, item.id, editName),
                      () => setEditingId(null),
                    );
                  }}
                >
                  <label htmlFor={`edit-${item.id}`} className="sr-only">
                    New name for {item.name}
                  </label>

                  <Input
                    id={`edit-${item.id}`}
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    maxLength={60}
                    autoFocus
                    disabled={isPending}
                  />

                  <Button type="submit" size="sm" disabled={isPending}>
                    Save
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                </form>
              ) : (
                <>
                  <span className="flex-1">
                    {item.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.productCount} product{item.productCount === 1 ? "" : "s"}
                    </span>
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                    }}
                    disabled={isPending}
                  >
                    Rename
                  </Button>

                  {confirmDeleteId === item.id ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => run(() => deleteTaxonomy(kind, item.id))}
                        disabled={isPending}
                      >
                        Yes, delete
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isPending}
                      >
                        Keep
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfirmDeleteId(item.id)}
                      disabled={isPending || item.productCount > 0}
                      title={
                        item.productCount > 0
                          ? `Used by ${item.productCount} product(s)`
                          : undefined
                      }
                    >
                      Delete
                    </Button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TaxonomyList;
