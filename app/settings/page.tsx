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
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
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
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
                <Badge variant="default">{user.role}</Badge>
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
      </Tabs>
    </div>
  )
}
