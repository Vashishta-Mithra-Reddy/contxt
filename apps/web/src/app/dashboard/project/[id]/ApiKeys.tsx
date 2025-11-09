"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";


type ApiKeyItem = {
  id: string;
  userId: string;
  projectId: string | null;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt: string | null;
  lastUsed: string | null;
  revoked: boolean;
  createdAt?: string;
};

export default function ApiKeys({ projectId }: { projectId: string }) {
  const [keys, setKeys] = React.useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");
  const [permissions, setPermissions] = React.useState<string[]>(["read"]);
  const [expiresAt, setExpiresAt] = React.useState<string>("");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const [newPlaintext, setNewPlaintext] = React.useState<string | null>(null);
  const [selectedPermission, setSelectedPermission] = React.useState<string>("read");
  const [neverExpires, setNeverExpires] = React.useState(true);

  React.useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/api-keys`, { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load API keys");
        const data = await res.json();
        if (!canceled) setKeys(data);
      } catch (err: any) {
        if (!canceled) setError(err?.message || "Failed to load API keys");
      } finally {
        if (!canceled) setLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [projectId]);

  // Remove togglePermission and use single-select handler via radio inputs
  // const togglePermission = (perm: string) => {
  //   setPermissions((prev) =>
  //     prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
  //   );
  // };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      const serverPermission = selectedPermission;

      const res = await fetch(`/api/projects/${projectId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          permissions: [serverPermission],
          neverExpires,
          expiresAt: neverExpires ? undefined : expiresAt || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to create API key");
      }
      const created = await res.json();
      setNewPlaintext(created.plaintextKey || created.fullKey || null);

      // Refresh the list to keep shapes consistent
      try {
        const resList = await fetch(`/api/projects/${projectId}/api-keys`, { cache: "no-store" });
        if (resList.ok) {
          const data = await resList.json();
          setKeys(data);
        }
      } catch {
        // silently ignore; main success is showing plaintext
      }

      setName("");
      setSelectedPermission("read");
      setNeverExpires(false);
      setExpiresAt("");
      toast.success("API key created. Copy it now — it is shown only once.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const copyPlaintext = async () => {
    if (!newPlaintext) return;
    try {
      await navigator.clipboard.writeText(newPlaintext);
      try {
        new Audio("/click.wav").play();
      } catch {}
      toast.success("Copied API key");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const revoke = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/api-keys/${id}/revoke`, { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to revoke key");
      }
      const updated = await res.json();
      setKeys((prev) => prev.map((k) => (k.id === id ? updated : k)));
      toast.success("Key revoked");
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke key");
    }
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>API Keys</CardTitle>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            // Clear plaintext when closing to enforce one-time display
            if (!open) {
              setNewPlaintext(null);
              setSelectedPermission("read");
              setNeverExpires(false);
              setExpiresAt("");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button type="button" onClick={() => setDialogOpen(true)}>Create Key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Keys are scoped to this project and can have fine-grained permissions.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onCreate} className="space-y-3">
              <Input
                type="text"
                placeholder="Key name (e.g. Production)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              {/* Single-select permissions via shared RadioGroup */}
              <div className="space-y-2 pb-2">
                <p className="text-sm font-medium">Permission</p>
                <RadioGroup
                  value={selectedPermission}
                  onValueChange={(val) => setSelectedPermission(val)}
                  className="grid grid-cols-2 gap-2"
                >
                  {["read", "write", "embed", "admin"].map((p) => (
                    <label key={p} htmlFor={`perm-${p}`} className="flex items-center gap-2 text-sm">
                      <RadioGroupItem id={`perm-${p}`} value={p} />
                      <span className="capitalize">{p}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Never Expires toggle via shared Switch; disables date input */}
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="never-expires"
                  checked={neverExpires}
                  onCheckedChange={(checked) => {
                    setNeverExpires(checked);
                    if (checked) setExpiresAt("");
                  }}
                />
                <label htmlFor="never-expires" className="text-sm">Never Expires</label>
              </div>
              {!neverExpires && (
              <Input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                disabled={neverExpires}
                className="pb-2"
              />)}

              <Button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Key"}
              </Button>
            </form>

            {newPlaintext && (
              <div className="mt-4 p-3 rounded-lg border">
                <p className="text-sm mb-2">
                  This API key is only shown once. Copy and store it securely now.
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs break-all flex-1">{newPlaintext}</code>
                  <Button type="button" variant="outline" onClick={copyPlaintext}>
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">Error: {error}</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading keys…</p>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">No keys yet.</p>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => {
              return (
                <div key={k.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Prefix: {k.keyPrefix} • Permissions: {k.permissions.join(", ")}
                    </p>
                    {k.expiresAt ? (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(k.expiresAt).toLocaleString()}
                      </p>
                    ) : null}
                    {k.lastUsed ? (
                      <p className="text-xs text-muted-foreground">
                        Last used: {new Date(k.lastUsed).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 pr-4">
                    {k.revoked ? (
                      <span className="text-sm text-destructive">Revoked</span>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => revoke(k.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

