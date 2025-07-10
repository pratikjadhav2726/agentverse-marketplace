"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Bell,
  CreditCard,
  Shield,
  Key,
  Trash2,
  Save,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Plus,
} from "lucide-react"
import { PaymentMethodCard } from "@/components/payment/payment-method-card"
import type { PaymentMethod } from "@/lib/payment-types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [showApiKey, setShowApiKey] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false)
  const [settings, setSettings] = useState({
    profile: {
      name: "",
      email: "",
      bio: "",
      company: "",
      website: "",
      location: "",
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      marketingEmails: false,
      weeklyDigest: true,
      agentUpdates: true,
      workflowAlerts: true,
    },
    privacy: {
      profileVisibility: "public",
      showEmail: false,
      showPurchases: false,
      allowAnalytics: true,
    },
    api: {
      apiKey: "av_sk_1234567890abcdef",
      webhookUrl: "",
      rateLimitTier: "standard",
    },
  })
  const [tools, setTools] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [credForm, setCredForm] = useState({ credential_name: "", credential_value: "", credential_type: "api_key", expires_at: "" });
  const [credLoading, setCredLoading] = useState(false);
  const [customCredDialogOpen, setCustomCredDialogOpen] = useState(false);
  const [customCredForm, setCustomCredForm] = useState({ credential_name: '', credential_value: '', credential_type: 'api_key', expires_at: '' });
  const [customCredLoading, setCustomCredLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin")
    } else if (user) {
      setSettings((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: user.name || "",
          email: user.email || "",
        },
      }))
    }
  }, [user, loading, router])

  const loadPaymentMethods = async () => {
    if (!user) return

    setLoadingPaymentMethods(true)
    try {
      const response = await fetch(`/api/payment-methods?userId=${user.id}`)
      const data = await response.json()
      setPaymentMethods(data.paymentMethods || [])
    } catch (error) {
      console.error("Failed to load payment methods:", error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadPaymentMethods()
    }
  }, [user])

  // Fetch tools and credentials for the user
  useEffect(() => {
    if (!user) return;
    fetch("/api/tools")
      .then((res) => res.json())
      .then((data) => setTools(data.tools || []));
    fetch(`/api/credentials?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCredentials(data.credentials || []));
  }, [user]);

  const openCredDialog = (tool: any, cred?: any) => {
    setSelectedTool(tool);
    setCredForm({
      credential_name: cred?.credential_name || "default",
      credential_value: "",
      credential_type: cred?.credential_type || tool.auth_type || "api_key",
      expires_at: cred?.expires_at || "",
    });
    setCredDialogOpen(true);
  };

  const handleCredSave = async () => {
    if (!user || !selectedTool) return;
    setCredLoading(true);
    await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        tool_id: selectedTool.id,
        ...credForm,
      }),
    });
    setCredDialogOpen(false);
    setCredLoading(false);
    // Refresh credentials
    fetch(`/api/credentials?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCredentials(data.credentials || []));
  };

  const handleCredDelete = async (cred: any) => {
    if (!user) return;
    await fetch(`/api/credentials?credential_id=${cred.id}&user_id=${user.id}`, { method: "DELETE" });
    // Refresh credentials
    fetch(`/api/credentials?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCredentials(data.credentials || []));
  };

  const handleCustomCredSave = async () => {
    if (!user) return;
    setCustomCredLoading(true);
    await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        tool_id: 'custom',
        ...customCredForm,
      }),
    });
    setCustomCredDialogOpen(false);
    setCustomCredLoading(false);
    // Refresh credentials
    fetch(`/api/credentials?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCredentials(data.credentials || []));
  };

  const handleCustomCredDelete = async (cred: any) => {
    if (!user) return;
    await fetch(`/api/credentials?credential_id=${cred.id}&user_id=${user.id}`, { method: 'DELETE' });
    // Refresh credentials
    fetch(`/api/credentials?user_id=${user.id}`)
      .then((res) => res.json())
      .then((data) => setCredentials(data.credentials || []));
  };

  const handleSave = async (section: string) => {
    // Mock save functionality
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log(`Saved ${section} settings:`, settings[section as keyof typeof settings])
  }

  const generateNewApiKey = async () => {
    const newKey = `av_sk_${Math.random().toString(36).substr(2, 24)}`
    setSettings((prev) => ({
      ...prev,
      api: { ...prev.api, apiKey: newKey },
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {(user as any)?.name || user?.email || 'User'}!</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Tool Credentials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.profile.name}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, name: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, email: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={settings.profile.bio}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, bio: e.target.value },
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={settings.profile.company}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, company: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.profile.website}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, website: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={settings.profile.location}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, location: e.target.value },
                    }))
                  }
                />
              </div>

              <Button onClick={() => handleSave("profile")}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === "admin"
                      ? "Admin"
                      : "User"}
                  </p>
                </div>
                <Badge variant={user?.role === "admin" ? "destructive" : "default"}>{user?.role === "admin" ? "Admin" : "User"}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified about important updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, emailNotifications: checked },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, pushNotifications: checked },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <p className="text-sm text-muted-foreground">Receive promotional content and updates</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={settings.notifications.marketingEmails}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, marketingEmails: checked },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-digest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Weekly summary of your activity</p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={settings.notifications.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, weeklyDigest: checked },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="agent-updates">Agent Updates</Label>
                  <p className="text-sm text-muted-foreground">Notifications about your purchased agents</p>
                </div>
                <Switch
                  id="agent-updates"
                  checked={settings.notifications.agentUpdates}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, agentUpdates: checked },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="workflow-alerts">Workflow Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notifications about workflow execution</p>
                </div>
                <Switch
                  id="workflow-alerts"
                  checked={settings.notifications.workflowAlerts}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      notifications: { ...prev.notifications, workflowAlerts: checked },
                    }))
                  }
                />
              </div>

              <Button onClick={() => handleSave("notifications")}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods for purchases and subscriptions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPaymentMethods ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </div>
              ) : paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      paymentMethod={method}
                      onDelete={(id) => {
                        // Handle delete
                        setPaymentMethods((prev) => prev.filter((m) => m.id !== id))
                      }}
                      onSetDefault={(id) => {
                        // Handle set default
                        setPaymentMethods((prev) =>
                          prev.map((m) => ({
                            ...m,
                            isDefault: m.id === id,
                          })),
                        )
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No payment methods added yet</p>
                </div>
              )}

              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View your past invoices and payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View All Invoices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy and data sharing preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="profile-visibility">Profile Visibility</Label>
                <Select
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, profileVisibility: value },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="agents-only">Agents Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-email">Show Email</Label>
                  <p className="text-sm text-muted-foreground">Display your email on your public profile</p>
                </div>
                <Switch
                  id="show-email"
                  checked={settings.privacy.showEmail}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, showEmail: checked },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-purchases">Show Purchases</Label>
                  <p className="text-sm text-muted-foreground">Display your purchased agents publicly</p>
                </div>
                <Switch
                  id="show-purchases"
                  checked={settings.privacy.showPurchases}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, showPurchases: checked },
                    }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-analytics">Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve the platform with usage analytics</p>
                </div>
                <Switch
                  id="allow-analytics"
                  checked={settings.privacy.allowAnalytics}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, allowAnalytics: checked },
                    }))
                  }
                />
              </div>

              <Button onClick={() => handleSave("privacy")}>
                <Save className="h-4 w-4 mr-2" />
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions that affect your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Deleting your account will permanently remove all your data, including purchased agents and
                    workflows.
                  </AlertDescription>
                </Alert>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Access</CardTitle>
              <CardDescription>Manage your API keys and integration settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={settings.api.apiKey}
                    readOnly
                    className="font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" onClick={generateNewApiKey}>
                    Regenerate
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Keep your API key secure. It provides full access to your account.
                </p>
              </div>

              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-app.com/webhooks/agentverse"
                  value={settings.api.webhookUrl}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      api: { ...prev.api, webhookUrl: e.target.value },
                    }))
                  }
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Receive real-time notifications about workflow executions and agent updates.
                </p>
              </div>

              <div>
                <Label>Rate Limit Tier</Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Standard</p>
                    <p className="text-sm text-muted-foreground">1,000 requests per hour</p>
                  </div>
                  <Badge variant="outline">Current</Badge>
                </div>
              </div>

              <Button onClick={() => handleSave("api")}>
                <Save className="h-4 w-4 mr-2" />
                Save API Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Learn how to integrate AgentVerse into your applications using our REST API.
              </p>
              <Button variant="outline">View API Docs</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tool Credentials</CardTitle>
              <CardDescription>Manage your API keys and integrations for MCP tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tools.map((tool) => {
                  const cred = credentials.find((c) => c.tool_id === tool.id);
                  return (
                    <Card key={tool.id} className="border shadow-sm">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{tool.name}</span>
                          <Badge variant="secondary">{tool.category}</Badge>
                        </div>
                        <CardDescription>{tool.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">Auth Type: {tool.auth_type}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">{tool.api_endpoint}</span>
                        </div>
                        {cred ? (
                          <>
                            <div className="mb-2">
                              <Badge variant="default">Credential Added</Badge>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => openCredDialog(tool, cred)}>
                              Update Credential
                            </Button>
                            <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleCredDelete(cred)}>
                              Remove
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" onClick={() => openCredDialog(tool)}>
                            Add Credential
                          </Button>
                        )}
                        {tool.documentation_url && (
                          <a href={tool.documentation_url} target="_blank" rel="noopener noreferrer" className="block mt-2 text-xs text-blue-600 underline">
                            Tool Documentation
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {/* Custom Credentials Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Custom Credentials</h3>
                  <Button size="sm" onClick={() => setCustomCredDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Custom Credential
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {credentials.filter((c) => c.tool_id === 'custom').map((cred) => (
                    <Card key={cred.id} className="border shadow-sm">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{cred.credential_name}</span>
                          <Badge variant="secondary">Custom</Badge>
                        </div>
                        <CardDescription>Custom credential for integrations or tools not listed above.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">Type: {cred.credential_type}</span>
                        </div>
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">Expires: {cred.expires_at || 'Never'}</span>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleCustomCredDelete(cred)}>
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Dialog open={credDialogOpen} onOpenChange={setCredDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedTool ? `Manage Credential for ${selectedTool.name}` : ""}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Credential Name</Label>
                  <Input value={credForm.credential_name} onChange={e => setCredForm(f => ({ ...f, credential_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Credential Value</Label>
                  <Input value={credForm.credential_value} onChange={e => setCredForm(f => ({ ...f, credential_value: e.target.value }))} type="password" />
                </div>
                <div>
                  <Label>Credential Type</Label>
                  <Select value={credForm.credential_type} onValueChange={v => setCredForm(f => ({ ...f, credential_type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth_token">OAuth Token</SelectItem>
                      <SelectItem value="oauth_refresh_token">OAuth Refresh Token</SelectItem>
                      <SelectItem value="username_password">Username/Password</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expires At</Label>
                  <Input value={credForm.expires_at} onChange={e => setCredForm(f => ({ ...f, expires_at: e.target.value }))} type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCredSave} disabled={credLoading}>
                  {credLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Save Credential"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Custom Credential Dialog */}
          <Dialog open={customCredDialogOpen} onOpenChange={setCustomCredDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Credential</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Credential Name</Label>
                  <Input value={customCredForm.credential_name} onChange={e => setCustomCredForm(f => ({ ...f, credential_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Credential Value</Label>
                  <Input value={customCredForm.credential_value} onChange={e => setCustomCredForm(f => ({ ...f, credential_value: e.target.value }))} type="password" />
                </div>
                <div>
                  <Label>Credential Type</Label>
                  <Select value={customCredForm.credential_type} onValueChange={v => setCustomCredForm(f => ({ ...f, credential_type: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="api_key">API Key</SelectItem>
                      <SelectItem value="oauth_token">OAuth Token</SelectItem>
                      <SelectItem value="oauth_refresh_token">OAuth Refresh Token</SelectItem>
                      <SelectItem value="username_password">Username/Password</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expires At</Label>
                  <Input value={customCredForm.expires_at} onChange={e => setCustomCredForm(f => ({ ...f, expires_at: e.target.value }))} type="date" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCustomCredSave} disabled={customCredLoading}>
                  {customCredLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Save Credential"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
