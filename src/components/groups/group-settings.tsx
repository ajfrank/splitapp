"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, LogOut, UserMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Group, GroupMemberWithUser } from "@/lib/types";

interface GroupSettingsProps {
  group: Group;
  members: GroupMemberWithUser[];
  currentUserId: string;
  isAdmin: boolean;
  onUpdate?: () => void;
}

export function GroupSettings({
  group,
  members,
  currentUserId,
  isAdmin,
  onUpdate,
}: GroupSettingsProps) {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [loading, setLoading] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSave() {
    setLoading(true);
    const { error } = await supabase
      .from("groups")
      .update({ name, description: description || null })
      .eq("id", group.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Group settings updated." });
      onUpdate?.();
      setShowSettings(false);
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    // Delete all related data first
    await supabase.from("expense_splits").delete().in(
      "expense_id",
      (await supabase.from("expenses").select("id").eq("group_id", group.id)).data?.map((e) => e.id) || []
    );
    await supabase.from("expenses").delete().eq("group_id", group.id);
    await supabase.from("settlements").delete().eq("group_id", group.id);
    await supabase.from("group_members").delete().eq("group_id", group.id);

    const { error } = await supabase.from("groups").delete().eq("id", group.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    } else {
      toast({ title: "Deleted", description: "Group has been deleted." });
      router.push("/dashboard");
    }
  }

  async function handleLeave() {
    setLoading(true);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", currentUserId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    } else {
      toast({ title: "Left group", description: "You have left the group." });
      router.push("/dashboard");
    }
  }

  async function handleRemoveMember(userId: string) {
    setRemovingMember(userId);
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "Member has been removed from the group." });
      onUpdate?.();
    }
    setRemovingMember(null);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowSettings(true)}
      >
        <Settings className="h-5 w-5" />
      </Button>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent onClose={() => setShowSettings(false)}>
          <DialogHeader>
            <DialogTitle>Group Settings</DialogTitle>
            <DialogDescription>
              Manage your group settings and members
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {/* Edit group details (admin only) */}
            {isAdmin && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Group Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
              </div>
            )}

            {/* Members list */}
            <div className="space-y-2">
              <Label>Members ({members.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                        {member.user?.full_name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user?.full_name || "Unknown"}
                          {member.user_id === currentUserId && (
                            <span className="text-gray-400 ml-1">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                      </div>
                    </div>
                    {isAdmin && member.user_id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={removingMember === member.user_id}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        {removingMember === member.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Danger zone */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-sm font-medium text-red-600">Danger Zone</p>
              <div className="flex gap-2">
                {!isAdmin && (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave Group
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </Button>
                )}
              </div>
            </div>
          </DialogBody>

          {isAdmin && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading || !name.trim()}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent onClose={() => setShowDeleteConfirm(false)}>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{group.name}&rdquo;? This action cannot be undone.
              All expenses and settlements will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent onClose={() => setShowLeaveConfirm(false)}>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave &ldquo;{group.name}&rdquo;? You&apos;ll need a new invite to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeave} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Leave Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
