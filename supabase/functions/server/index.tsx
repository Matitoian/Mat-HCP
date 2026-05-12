// Add checks for environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

// Replace Deno-specific imports with Node.js-compatible imports
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// ── HELPERS ──────────────────────────────────────────────────────────────────

const adminClient = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function genId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function getAuthUser(req: Request) {
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const { data: { user }, error } = await adminClient().auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch (e) {
    console.log('Auth token error:', e);
    return null;
  }
}

async function requireAdmin(c: any) {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return null;
  const profile = await kv.get(`user:profile:${authUser.id}`);
  if (profile?.role !== 'admin') return null;
  return authUser;
}

// ── HEALTH ───────────────────────────────────────────────────────────────────

app.get("/health", (c: any) => {
  return c.json({ status: "ok", service: "HouseCom API v2 (Supabase)" });
});

// ── AUTH: SIGNUP ─────────────────────────────────────────────────────────────

app.post("/auth/signup", async (c: any) => {
  try {
    const { name, email, phone, password, role, county, isStudent, studentId } = await c.req.json();
    if (!name || !email || !password || !role) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }
    const supabase = adminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, phone, county, isStudent, studentId },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });
    if (error) {
      console.log('Signup error:', error.message);
      return c.json({ success: false, message: error.message }, 400);
    }
    const userId = data.user.id;
    const profile = {
      id: userId,
      name,
      email,
      phone: phone || '',
      role,
      county: county || 'Mombasa',
      verified: false,
      isStudent: isStudent || false,
      studentId: studentId || null,
      avatar: `https://i.pravatar.cc/150?u=${email}`,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`user:profile:${userId}`, profile);
    return c.json({ success: true, message: 'Account created successfully', user: profile });
  } catch (e) {
    console.log('Signup critical error:', e);
    return c.json({ success: false, message: `Signup failed: ${e}` }, 500);
  }
});

// ── USER PROFILE ─────────────────────────────────────────────────────────────

app.get("/user/profile", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    let profile = await kv.get(`user:profile:${authUser.id}`);
    if (!profile) {
      profile = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        phone: authUser.user_metadata?.phone || '',
        role: authUser.user_metadata?.role || 'tenant',
        county: authUser.user_metadata?.county || 'Mombasa',
        verified: false,
        isStudent: authUser.user_metadata?.isStudent || false,
        studentId: authUser.user_metadata?.studentId || null,
        avatar: `https://i.pravatar.cc/150?u=${authUser.email}`,
        createdAt: new Date().toISOString(),
      };
      await kv.set(`user:profile:${authUser.id}`, profile);
    }
    return c.json({ success: true, user: profile });
  } catch (e) {
    console.log('Get profile error:', e);
    return c.json({ error: `Failed to get profile: ${e}` }, 500);
  }
});

app.put("/user/profile", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const updates = await c.req.json();
    const existing = await kv.get(`user:profile:${authUser.id}`) || {};
    const updated = { ...existing, ...updates, id: authUser.id, updatedAt: new Date().toISOString() };
    await kv.set(`user:profile:${authUser.id}`, updated);
    return c.json({ success: true, user: updated });
  } catch (e) {
    return c.json({ error: `Failed to update profile: ${e}` }, 500);
  }
});

// ── PROPERTIES ───────────────────────────────────────────────────────────────

app.get("/properties", async (c: any) => {
  try {
    const { county, minPrice, maxPrice, bedrooms, verified, landlordId, limit: lim, search } = c.req.query();
    let properties: any[] = await kv.getByPrefix("property:data:");

    if (county && county !== 'All') properties = properties.filter((p: any) => p.county === county);
    if (minPrice) properties = properties.filter((p: any) => p.price >= parseInt(minPrice));
    if (maxPrice) properties = properties.filter((p: any) => p.price <= parseInt(maxPrice));
    if (bedrooms && bedrooms !== 'all') properties = properties.filter((p: any) => p.bedrooms === parseInt(bedrooms));
    if (verified === 'true') properties = properties.filter((p: any) => p.verified === true);
    if (landlordId) properties = properties.filter((p: any) => p.landlordId === landlordId);
    if (search) {
      const q = search.toLowerCase();
      properties = properties.filter((p: any) =>
        p.title?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.landlordName?.toLowerCase().includes(q) ||
        p.county?.toLowerCase().includes(q) ||
        p.uniName?.toLowerCase().includes(q)
      );
    }

    properties.sort((a: any, b: any) => {
      const numA = parseInt(a.id) || 0;
      const numB = parseInt(b.id) || 0;
      return numA - numB;
    });

    if (lim) properties = properties.slice(0, parseInt(lim));
    return c.json({ success: true, properties, total: properties.length });
  } catch (e) {
    console.log('Get properties error:', e);
    return c.json({ error: `Failed to get properties: ${e}` }, 500);
  }
});

app.get("/properties/:id", async (c: any) => {
  try {
    const { id } = c.req.param();
    const property = await kv.get(`property:data:${id}`);
    if (!property) return c.json({ error: 'Property not found' }, 404);
    return c.json({ success: true, property });
  } catch (e) {
    return c.json({ error: `Failed to get property: ${e}` }, 500);
  }
});

app.post("/properties", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const data = await c.req.json();
    const id = `landlord_${genId()}`;
    const profile = await kv.get(`user:profile:${authUser.id}`);
    const property = {
      ...data,
      id,
      landlordId: authUser.id,
      landlordName: profile?.name || 'Unknown Landlord',
      landlordRating: profile?.rating || 4.0,
      landlordVerified: profile?.verified || false,
      verified: false,
      rating: 0,
      reviews: 0,
      images: data.images || ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      createdAt: new Date().toISOString(),
    };
    await kv.set(`property:data:${id}`, property);
    return c.json({ success: true, property });
  } catch (e) {
    return c.json({ error: `Failed to create property: ${e}` }, 500);
  }
});

app.put("/properties/:id", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const existing = await kv.get(`property:data:${id}`);
    if (!existing) return c.json({ error: 'Property not found' }, 404);
    if (existing.landlordId !== authUser.id) return c.json({ error: 'Forbidden' }, 403);
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await kv.set(`property:data:${id}`, updated);
    return c.json({ success: true, property: updated });
  } catch (e) {
    return c.json({ error: `Failed to update property: ${e}` }, 500);
  }
});

app.delete("/properties/:id", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { id } = c.req.param();
    const existing = await kv.get(`property:data:${id}`);
    if (!existing) return c.json({ error: 'Property not found' }, 404);
    if (existing.landlordId !== authUser.id) {
      const profile = await kv.get(`user:profile:${authUser.id}`);
      if (profile?.role !== 'admin') return c.json({ error: 'Forbidden' }, 403);
    }
    await kv.del(`property:data:${id}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to delete property: ${e}` }, 500);
  }
});

// ── SAVED PROPERTIES ─────────────────────────────────────────────────────────

app.get("/saved", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const savedMarkers: any[] = await kv.getByPrefix(`saved:${authUser.id}:`);
    if (savedMarkers.length === 0) return c.json({ success: true, properties: [], propertyIds: [] });
    const propertyIds = savedMarkers.map((m: any) => m.propertyId);
    const properties = await Promise.all(propertyIds.map((id: string) => kv.get(`property:data:${id}`)));
    return c.json({ success: true, properties: properties.filter(Boolean), propertyIds });
  } catch (e) {
    return c.json({ error: `Failed to get saved: ${e}` }, 500);
  }
});

app.post("/saved", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { propertyId } = await c.req.json();
    await kv.set(`saved:${authUser.id}:${propertyId}`, { propertyId, userId: authUser.id, savedAt: new Date().toISOString() });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to save property: ${e}` }, 500);
  }
});

app.delete("/saved/:propertyId", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { propertyId } = c.req.param();
    await kv.del(`saved:${authUser.id}:${propertyId}`);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to unsave property: ${e}` }, 500);
  }
});

// ── CHATS ────────────────────────────────────────────────────────────────────

app.get("/chats", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const chatMembers: any[] = await kv.getByPrefix(`chat:member:${authUser.id}:`);
    const chatIds = chatMembers.map((m: any) => m.chatId);
    if (chatIds.length === 0) return c.json({ success: true, chats: [] });
    const chats = await Promise.all(chatIds.map((id: string) => kv.get(`chat:meta:${id}`)));
    const validChats = chats.filter(Boolean);
    validChats.sort((a: any, b: any) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
    return c.json({ success: true, chats: validChats });
  } catch (e) {
    return c.json({ error: `Failed to get chats: ${e}` }, 500);
  }
});

app.post("/chats", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { propertyId, landlordId } = await c.req.json();
    // Check if chat already exists
    const existingChats: any[] = await kv.getByPrefix(`chat:meta:`);
    const existing = existingChats.find((chat: any) =>
      chat.propertyId === propertyId &&
      chat.tenantId === authUser.id &&
      chat.landlordId === landlordId
    );
    if (existing) return c.json({ success: true, chat: existing });

    const property = await kv.get(`property:data:${propertyId}`);
    const landlordProfile = await kv.get(`user:profile:${landlordId}`);
    const tenantProfile = await kv.get(`user:profile:${authUser.id}`);
    const chatId = genId();
    const chat = {
      id: chatId,
      propertyId,
      propertyTitle: property?.title || 'Property',
      propertyImage: property?.images?.[0] || '',
      tenantId: authUser.id,
      tenantName: tenantProfile?.name || 'Tenant',
      landlordId,
      landlordName: landlordProfile?.name || 'Landlord',
      messages: [],
      unread: 0,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    await kv.set(`chat:meta:${chatId}`, chat);
    await kv.set(`chat:member:${authUser.id}:${chatId}`, { chatId, userId: authUser.id });
    await kv.set(`chat:member:${landlordId}:${chatId}`, { chatId, userId: landlordId });
    return c.json({ success: true, chat });
  } catch (e) {
    return c.json({ error: `Failed to create chat: ${e}` }, 500);
  }
});

app.get("/chats/:id/messages", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { id } = c.req.param();
    const messages: any[] = await kv.getByPrefix(`msg:${id}:`);
    messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return c.json({ success: true, messages });
  } catch (e) {
    return c.json({ error: `Failed to get messages: ${e}` }, 500);
  }
});

app.post("/chats/:id/messages", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { id } = c.req.param();
    const { text, type = 'text' } = await c.req.json();
    const profile = await kv.get(`user:profile:${authUser.id}`);
    const msgId = genId();
    const timestamp = new Date().toISOString();
    const message = { id: msgId, chatId: id, senderId: authUser.id, senderName: profile?.name || 'User', text, type, timestamp };
    await kv.set(`msg:${id}:${timestamp}:${msgId}`, message);
    const chat = await kv.get(`chat:meta:${id}`);
    if (chat) {
      chat.lastMessage = text;
      chat.lastMessageTime = timestamp;
      chat.unread = (chat.unread || 0) + 1;
      await kv.set(`chat:meta:${id}`, chat);
    }
    return c.json({ success: true, message });
  } catch (e) {
    return c.json({ error: `Failed to send message: ${e}` }, 500);
  }
});

// ── PAYMENTS ─────────────────────────────────────────────────────────────────

app.post("/payments", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { propertyId, amount, mpesaCode, month, mpesaTill } = await c.req.json();
    const paymentId = genId();
    const profile = await kv.get(`user:profile:${authUser.id}`);
    const property = await kv.get(`property:data:${propertyId}`);
    const payment = {
      id: paymentId,
      tenantId: authUser.id,
      tenantName: profile?.name || 'Tenant',
      propertyId,
      propertyTitle: property?.title || 'Property',
      amount,
      mpesaCode,
      mpesaTill: mpesaTill || property?.mpesaTill,
      month,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await kv.set(`payment:${authUser.id}:${paymentId}`, payment);
    // Notify landlord
    if (property?.landlordId) {
      const notifId = genId();
      await kv.set(`notif:${property.landlordId}:${notifId}`, {
        id: notifId, type: 'payment',
        text: `Payment of KSh ${amount?.toLocaleString()} received from ${profile?.name} for ${property?.title}`,
        read: false, createdAt: new Date().toISOString(),
      });
    }
    return c.json({ success: true, payment });
  } catch (e) {
    return c.json({ error: `Failed to create payment: ${e}` }, 500);
  }
});

app.get("/payments", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const payments: any[] = await kv.getByPrefix(`payment:${authUser.id}:`);
    payments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ success: true, payments });
  } catch (e) {
    return c.json({ error: `Failed to get payments: ${e}` }, 500);
  }
});

// ── RATINGS ──────────────────────────────────────────────────────────────────

app.get("/ratings/:propertyId", async (c: any) => {
  try {
    const { propertyId } = c.req.param();
    const ratings: any[] = await kv.getByPrefix(`rating:${propertyId}:`);
    const avg = ratings.length > 0 ? ratings.reduce((s: number, r: any) => s + r.score, 0) / ratings.length : 0;
    return c.json({ success: true, ratings, avgRating: parseFloat(avg.toFixed(1)), count: ratings.length });
  } catch (e) {
    return c.json({ error: `Failed to get ratings: ${e}` }, 500);
  }
});

app.post("/ratings", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { propertyId, score, comment, type = 'property' } = await c.req.json();
    const profile = await kv.get(`user:profile:${authUser.id}`);
    const rating = { propertyId, userId: authUser.id, userName: profile?.name || 'Anonymous', score, comment, type, createdAt: new Date().toISOString() };
    await kv.set(`rating:${propertyId}:${authUser.id}`, rating);
    const allRatings: any[] = await kv.getByPrefix(`rating:${propertyId}:`);
    const avg = allRatings.reduce((s: number, r: any) => s + r.score, 0) / allRatings.length;
    const property = await kv.get(`property:data:${propertyId}`);
    if (property) {
      property.rating = parseFloat(avg.toFixed(1));
      property.reviews = allRatings.length;
      await kv.set(`property:data:${propertyId}`, property);
    }
    return c.json({ success: true, rating });
  } catch (e) {
    return c.json({ error: `Failed to submit rating: ${e}` }, 500);
  }
});

// ── FRAUD REPORTS ─────────────────────────────────────────────────────────────

app.post("/fraud-reports", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { propertyId, reason, details } = await c.req.json();
    const reportId = genId();
    const profile = await kv.get(`user:profile:${authUser.id}`);
    const property = await kv.get(`property:data:${propertyId}`);
    const report = {
      id: reportId, propertyId, propertyTitle: property?.title || 'Unknown',
      reporterId: authUser.id, reporterName: profile?.name || 'Anonymous',
      reason, details, status: 'pending', createdAt: new Date().toISOString(),
    };
    await kv.set(`fraud:${reportId}`, report);
    return c.json({ success: true, report });
  } catch (e) {
    return c.json({ error: `Failed to submit fraud report: ${e}` }, 500);
  }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

app.get("/notifications", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const notifs: any[] = await kv.getByPrefix(`notif:${authUser.id}:`);
    notifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ success: true, notifications: notifs.slice(0, 20) });
  } catch (e) {
    return c.json({ error: `Failed to get notifications: ${e}` }, 500);
  }
});

app.post("/notifications/create", async (c: any) => {
  const authUser = await getAuthUser(c.req.raw);
  if (!authUser) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { userId, type, text } = await c.req.json();
    const targetUserId = userId || authUser.id;
    const notifId = genId();
    await kv.set(`notif:${targetUserId}:${notifId}`, {
      id: notifId, type, text, read: false, createdAt: new Date().toISOString(),
    });
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: `Failed to create notification: ${e}` }, 500);
  }
});

// ── ADMIN ─────────────────────────────────────────────────────────────────────

app.get("/admin/stats", async (c: any) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized - admin only' }, 401);
  try {
    const properties: any[] = await kv.getByPrefix("property:data:");
    const fraudReports: any[] = await kv.getByPrefix("fraud:");
    const payments: any[] = await kv.getByPrefix("payment:");
    const users: any[] = await kv.getByPrefix("user:profile:");
    const verifiedProps = properties.filter((p: any) => p.verified).length;
    const pendingProps = properties.filter((p: any) => !p.verified).length;
    const pendingFraud = fraudReports.filter((r: any) => r.status === 'pending').length;
    const totalRevenue = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    return c.json({
      success: true, stats: {
        totalProperties: properties.length, verifiedProperties: verifiedProps,
        pendingProperties: pendingProps, totalFraudReports: fraudReports.length,
        pendingFraudReports: pendingFraud, totalPayments: payments.length,
        totalRevenue, totalUsers: users.length,
        tenants: users.filter((u: any) => u.role === 'tenant').length,
        landlords: users.filter((u: any) => u.role === 'landlord').length,
      }
    });
  } catch (e) {
    return c.json({ error: `Failed to get admin stats: ${e}` }, 500);
  }
});

app.get("/admin/properties", async (c: any) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const properties: any[] = await kv.getByPrefix("property:data:");
    properties.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return c.json({ success: true, properties });
  } catch (e) {
    return c.json({ error: `Failed to get properties: ${e}` }, 500);
  }
});

app.get("/admin/users", async (c: any) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const users: any[] = await kv.getByPrefix("user:profile:");
    return c.json({ success: true, users });
  } catch (e) {
    return c.json({ error: `Failed to get users: ${e}` }, 500);
  }
});

app.get("/admin/fraud-reports", async (c: any) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const reports: any[] = await kv.getByPrefix("fraud:");
    reports.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ success: true, reports });
  } catch (e) {
    return c.json({ error: `Failed to get fraud reports: ${e}` }, 500);
  }
});

app.put("/admin/properties/:id/verify", async (c: any) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { id } = c.req.param();
    const { verified } = await c.req.json();
    const property = await kv.get(`property:data:${id}`);
    if (!property) return c.json({ error: 'Property not found' }, 404);
    property.verified = verified;
    property.verifiedAt = new Date().toISOString();
    await kv.set(`property:data:${id}`, property);
    return c.json({ success: true, property });
  } catch (e) {
    return c.json({ error: `Failed to verify property: ${e}` }, 500);
  }
});

app.put("/admin/fraud-reports/:id", async (c: any) => {
  const admin = await requireAdmin(c);
  if (!admin) return c.json({ error: 'Unauthorized' }, 401);
  try {
    const { id } = c.req.param();
    const { status } = await c.req.json();
    const report = await kv.get(`fraud:${id}`);
    if (!report) return c.json({ error: 'Report not found' }, 404);
    report.status = status;
    report.resolvedAt = new Date().toISOString();
    await kv.set(`fraud:${id}`, report);
    return c.json({ success: true, report });
  } catch (e) {
    return c.json({ error: `Failed to update fraud report: ${e}` }, 500);
  }
});

// ── SEED DATA ─────────────────────────────────────────────────────────────────

app.post("/seed", async (c: any) => {
  try {
    const seeded = await kv.get("meta:seeded");
    
    // Seed properties (only once)
    if (!seeded) {
      const properties = generateSeedProperties();
      const keys = properties.map((p: any) => `property:data:${p.id}`);
      await kv.mset(keys, properties);
      console.log(`✅ Seeded ${properties.length} properties`);
    }

    // Always ensure demo users exist (will skip if they do)
    const supabase = adminClient();
    const demoUsers = [
      { email: 'grace@example.com', password: 'password123', name: 'Grace Mwangi', role: 'tenant', county: 'Mombasa', phone: '+254712345678', isStudent: true, studentId: 'TUM/2024/1234' },
      { email: 'juma@example.com', password: 'password123', name: 'Juma Khalifa', role: 'landlord', county: 'Mombasa', phone: '+254723456789', isStudent: false },
      { email: 'admin@housecom.co.ke', password: 'password123', name: 'Admin User', role: 'admin', county: 'Mombasa', phone: '+254700000000', isStudent: false },
    ];
    
    let createdCount = 0;
    for (const u of demoUsers) {
      try {
        let userId: string | null = null;
        
        // Check if user exists in KV first
        const existingProfiles = await kv.get(`user:profile:*`);
        if (existingProfiles) {
          const profile = Object.values(existingProfiles).find((p: any) => p.email === u.email);
          if (profile) {
            userId = (profile as any).id;
          }
        }
        
        // If not in KV, try Supabase Auth
        if (!userId) {
          try {
            const { data: existingUser } = await supabase.auth.admin.getUserById(u.email);
            if (existingUser?.user) {
              userId = existingUser.user.id;
            }
          } catch (e) {
            // User doesn't exist, will create
          }
        }
        
        // If user doesn't exist anywhere, create it
        if (!userId) {
          try {
            const { data, error } = await supabase.auth.admin.createUser({
              email: u.email, 
              password: u.password,
              user_metadata: { 
                name: u.name, 
                role: u.role, 
                phone: u.phone, 
                county: u.county,
                isStudent: u.isStudent,
                studentId: (u as any).studentId
              },
              email_confirm: true,
            });
            
            if (error) {
              console.log(`⚠️ User creation error for ${u.email}:`, error.message);
              continue;
            }
            if (data?.user?.id) {
              userId = data.user.id;
            } else {
              continue;
            }
          } catch (createErr) {
            console.log(`⚠️ Error creating ${u.email}:`, createErr);
            continue;
          }
        }
        
        // Save/update profile in KV
        if (userId) {
          await kv.set(`user:profile:${userId}`, {
            id: userId, 
            name: u.name, 
            email: u.email, 
            phone: u.phone,
            role: u.role, 
            county: u.county, 
            verified: true,
            isStudent: u.isStudent, 
            studentId: (u as any).studentId || null,
            rating: u.role === 'landlord' ? 4.5 : undefined,
            avatar: `https://i.pravatar.cc/150?u=${u.email}`,
            createdAt: new Date().toISOString(),
          });
          createdCount++;
          console.log(`✅ Demo user ${u.email} (${u.role}) ready`);
        }
      } catch (userErr) {
        console.log(`⚠️ Error processing ${u.email}:`, userErr);
      }
    }

    // Mark as seeded
    await kv.set("meta:seeded", { seededAt: new Date().toISOString(), demoUsersReady: createdCount });

    return c.json({ success: true, message: `✅ Seeded with ${createdCount} demo users ready`, demoUsersReady: createdCount });
  } catch (e) {
    console.log('Seed error:', e);
    return c.json({ success: false, error: `Seed failed: ${String(e).substring(0, 200)}` }, 500);
  }
});

app.post("/seed/reset", async (c: any) => {
  try {
    await kv.del("meta:seeded");
    
    // Also delete demo user profiles to force recreation
    await kv.del("demo:users:created");
    
    return c.json({ success: true, message: "Seed reset. Demo users will be recreated on next login." });
  } catch (e) {
    return c.json({ error: `Reset failed: ${e}` }, 500);
  }
});

// ── SETUP DEMO USERS ─────────────────────────────────────────────────────────

app.post("/demo-setup", async (c: any) => {
  try {
    const supabase = adminClient();
    const demoUsers = [
      { email: 'grace@example.com', password: 'password123', name: 'Grace Mwangi', role: 'tenant', county: 'Mombasa', phone: '+254712345678', isStudent: true, studentId: 'TUM/2024/1234' },
      { email: 'juma@example.com', password: 'password123', name: 'Juma Khalifa', role: 'landlord', county: 'Mombasa', phone: '+254723456789', isStudent: false },
      { email: 'admin@housecom.co.ke', password: 'password123', name: 'Admin User', role: 'admin', county: 'Mombasa', phone: '+254700000000', isStudent: false },
    ];
    
    const results: any[] = [];
    
    for (const u of demoUsers) {
      try {
        let user = null;
        
        // Try to get the user first
        try {
          const { data: existingUser } = await supabase.auth.admin.getUserById(u.email);
          if (existingUser?.user) {
            user = existingUser.user;
            // Update metadata
            await supabase.auth.admin.updateUserById(user.id, {
              user_metadata: {
                name: u.name,
                role: u.role,
                phone: u.phone,
                county: u.county,
                isStudent: u.isStudent,
                studentId: (u as any).studentId
              }
            });
          }
        } catch (e) {
          // User doesn't exist, create it
        }
        
        // If user still doesn't exist, create it
        if (!user) {
          const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            user_metadata: {
              name: u.name,
              role: u.role,
              phone: u.phone,
              county: u.county,
              isStudent: u.isStudent,
              studentId: (u as any).studentId
            },
            email_confirm: true,
          });
          
          if (error) {
            results.push({ email: u.email, status: 'error', message: error.message });
            continue;
          }
          user = data.user;
        }
        
        // Save profile to KV
        if (user) {
          await kv.set(`user:profile:${user.id}`, {
            id: user.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            county: u.county,
            verified: true,
            isStudent: u.isStudent,
            studentId: (u as any).studentId || null,
            rating: u.role === 'landlord' ? 4.5 : undefined,
            avatar: `https://i.pravatar.cc/150?u=${u.email}`,
            createdAt: new Date().toISOString(),
          });
          
          results.push({ email: u.email, role: u.role, status: 'ready', userId: user.id });
        }
      } catch (err) {
        results.push({ email: u.email, status: 'error', message: String(err) });
      }
    }
    
    return c.json({ success: true, message: 'Demo users setup complete', users: results });
  } catch (e) {
    console.log('Demo setup error:', e);
    return c.json({ error: `Setup failed: ${e}` }, 500);
  }
});

// ── SEED DATA GENERATOR ───────────────────────────────────────────────────────

function generateSeedProperties(): any[] {
  const props: any[] = [];

  const mombasaLocs = [
    { name: 'Tudor', lat: -4.0435, lng: 39.6682, dist: 0.8 },
    { name: 'Mikindani', lat: -4.0547, lng: 39.6744, dist: 1.2 },
    { name: 'Changamwe', lat: -4.0219, lng: 39.6346, dist: 2.5 },
    { name: 'Buxton', lat: -4.0500, lng: 39.6700, dist: 1.5 },
    { name: 'Bamburi', lat: -3.9858, lng: 39.7288, dist: 8.2 },
    { name: 'Nyali', lat: -4.0500, lng: 39.7000, dist: 6.5 },
    { name: 'Likoni', lat: -4.0833, lng: 39.6667, dist: 4.2 },
    { name: 'Bombolulu', lat: -4.0219, lng: 39.6900, dist: 5.8 },
  ];
  const kilifiLocs = [
    { name: 'Kilifi Town', lat: -3.6309, lng: 39.8468, dist: 0.5 },
    { name: 'Malindi Town', lat: -3.2186, lng: 40.1169, dist: 8.5 },
    { name: 'Watamu', lat: -3.3583, lng: 40.0333, dist: 12.0 },
    { name: 'Mtwapa', lat: -3.9500, lng: 39.7333, dist: 15.2 },
    { name: 'Takaungu', lat: -3.6833, lng: 39.8500, dist: 5.5 },
  ];
  const kwaleLocs = [
    { name: 'Diani Beach', lat: -4.3201, lng: 39.5809, dist: 35.0 },
    { name: 'Ukunda', lat: -4.2833, lng: 39.5667, dist: 32.0 },
    { name: 'Msambweni', lat: -4.4667, lng: 39.4833, dist: 45.0 },
    { name: 'Lunga Lunga', lat: -4.5667, lng: 39.4167, dist: 52.0 },
    { name: 'Kinango', lat: -3.9333, lng: 39.2833, dist: 55.0 },
  ];
  const lamuLocs = [
    { name: 'Lamu Old Town', lat: -2.2717, lng: 40.9020, dist: 150.0 },
    { name: 'Shela Village', lat: -2.2617, lng: 40.9120, dist: 152.0 },
    { name: 'Matondoni', lat: -2.2317, lng: 40.8920, dist: 155.0 },
    { name: 'Manda Island', lat: -2.2500, lng: 40.9500, dist: 153.0 },
  ];

  const ptypes = [
    { type: '1BD Apartment', bedrooms: 1, bathrooms: 1, desc: 'Cozy 1-bedroom apartment', base: 6500 },
    { type: 'Studio', bedrooms: 1, bathrooms: 1, desc: 'Modern studio apartment', base: 6000 },
    { type: '2BD Apartment', bedrooms: 2, bathrooms: 1, desc: 'Spacious 2-bedroom apartment', base: 9500 },
    { type: 'Bachelor', bedrooms: 1, bathrooms: 1, desc: 'Compact bachelor unit', base: 5500 },
    { type: 'Bedsitter', bedrooms: 1, bathrooms: 1, desc: 'Affordable bedsitter', base: 5000 },
    { type: '3BD House', bedrooms: 3, bathrooms: 2, desc: 'Family-friendly 3-bedroom house', base: 18000 },
  ];
  const amenityLists = [
    ['WiFi', '24/7 Water', 'Parking', 'Security', 'Kitchen'],
    ['WiFi', '24/7 Water', 'Security', 'Kitchen', 'Balcony'],
    ['WiFi', 'Water', 'Parking', 'Security', 'Generator'],
    ['WiFi', '24/7 Water', 'Parking', 'Security', 'Kitchen', 'Balcony', 'CCTV'],
    ['WiFi', '24/7 Water', 'Beach Access', 'Security', 'Kitchen', 'Pool'],
  ];
  const llNames = [
    'Juma Khalifa', 'Amina Hassan', 'Omar Abdalla', 'Fatuma Ali', 'Hassan Mwalimu',
    'Zainab Mohamed', 'Ahmed Salim', 'Mwanajuma Said', 'Ali Rashid', 'Khadija Omar',
    'Mohamed Bakari', 'Halima Juma', 'Rashid Ali', 'Aziza Hassan', 'Hamisi Mwangi',
    'Mariam Saleh', 'Ibrahim Faraj', 'Rehema Abdalla', 'Salim Khamis', 'Asha Mohamed',
  ];
  const imgSets = [
    ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
    ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800'],
    ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'],
    ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800'],
    ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
  ];

  let id = 1;

  // Mombasa (20)
  for (let i = 0; i < 20; i++) {
    const loc = mombasaLocs[i % mombasaLocs.length];
    const pt = ptypes[i % ptypes.length];
    const llId = i < 4 ? 'LL1' : `LL${id + 10}`;
    const llName = i < 4 ? 'Juma Khalifa' : llNames[i % llNames.length];
    props.push({
      id: String(id++), landlordId: llId, landlordName: llName,
      landlordRating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), landlordVerified: i % 3 !== 0,
      title: `${pt.type} ${loc.name} - ${i % 2 === 0 ? 'Near TUM' : 'Secure Compound'}`,
      description: `${pt.desc} in ${loc.name}, Mombasa. Perfect for ${i % 2 === 0 ? 'TUM students' : 'young professionals'}.`,
      price: pt.base + (i % 5) * 500, county: 'Mombasa', location: `${loc.name}, Mombasa`,
      latitude: loc.lat + (i % 5 - 2) * 0.002, longitude: loc.lng + (i % 5 - 2) * 0.002,
      images: imgSets[i % imgSets.length], bedrooms: pt.bedrooms, bathrooms: pt.bathrooms,
      amenities: amenityLists[i % amenityLists.length],
      security: { score: parseFloat((3.0 + (i % 20) * 0.1).toFixed(1)), askari24hr: i % 2 === 0, cctv: i % 3 !== 0, fence: true, compound: `${loc.name} ${i % 2 === 0 ? 'Estate' : 'Apartments'}` },
      verified: i % 4 !== 0, rating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), reviews: 5 + (i % 30),
      distanceToUni: parseFloat((loc.dist + (i % 5) * 0.2).toFixed(1)), uniName: 'TUM',
      mpesaTill: `HC00${1000 + id}`, touristFriendly: i % 5 === 0, createdAt: new Date().toISOString(),
    });
  }

  // Kilifi (20)
  for (let i = 0; i < 20; i++) {
    const loc = kilifiLocs[i % kilifiLocs.length];
    const pt = ptypes[i % ptypes.length];
    const isBeach = loc.name.includes('Malindi') || loc.name.includes('Watamu');
    props.push({
      id: String(id++), landlordId: `LL${id}`, landlordName: llNames[i % llNames.length],
      landlordRating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), landlordVerified: i % 3 !== 0,
      title: `${pt.type} ${loc.name} ${isBeach ? '- Ocean View' : '- Near Pwani Uni'}`,
      description: `${pt.desc} in ${loc.name}, Kilifi. ${isBeach ? 'Ocean views' : 'Close to Pwani University'}.`,
      price: pt.base + (isBeach ? 3000 : 0) + (i % 5) * 500, county: 'Kilifi', location: `${loc.name}, Kilifi`,
      latitude: loc.lat + (i % 5 - 2) * 0.002, longitude: loc.lng + (i % 5 - 2) * 0.002,
      images: imgSets[i % imgSets.length], bedrooms: pt.bedrooms, bathrooms: pt.bathrooms,
      amenities: amenityLists[i % amenityLists.length],
      security: { score: parseFloat((3.0 + (i % 20) * 0.1).toFixed(1)), askari24hr: i % 2 === 0, cctv: i % 3 !== 0, fence: i % 2 === 0, compound: `${loc.name} ${i % 2 === 0 ? 'Villas' : 'Residence'}` },
      verified: i % 4 !== 0, rating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), reviews: 5 + (i % 25),
      distanceToUni: parseFloat((loc.dist + (i % 5) * 0.3).toFixed(1)), uniName: 'Pwani University',
      mpesaTill: `HC00${1000 + id}`, touristFriendly: isBeach,
      beachDistance: isBeach ? parseFloat((0.2 + (i % 5) * 0.2).toFixed(1)) : undefined, createdAt: new Date().toISOString(),
    });
  }

  // Kwale (20)
  for (let i = 0; i < 20; i++) {
    const loc = kwaleLocs[i % kwaleLocs.length];
    const pt = ptypes[i % ptypes.length];
    const isDiani = loc.name.includes('Diani');
    props.push({
      id: String(id++), landlordId: `LL${id}`, landlordName: llNames[i % llNames.length],
      landlordRating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), landlordVerified: i % 3 !== 0,
      title: `${pt.type} ${loc.name} ${isDiani ? '- Beach Paradise' : '- Quiet Area'}`,
      description: `${pt.desc} in ${loc.name}, Kwale.`,
      price: pt.base + (isDiani ? 5000 : 1000) + (i % 5) * 500, county: 'Kwale', location: `${loc.name}, Kwale`,
      latitude: loc.lat + (i % 5 - 2) * 0.002, longitude: loc.lng + (i % 5 - 2) * 0.002,
      images: imgSets[i % imgSets.length], bedrooms: pt.bedrooms, bathrooms: pt.bathrooms,
      amenities: isDiani ? [...amenityLists[i % amenityLists.length], 'Beach Access'] : amenityLists[i % amenityLists.length],
      security: { score: parseFloat((isDiani ? 4.2 : 3.2 + (i % 10) * 0.08).toFixed(1)), askari24hr: isDiani || i % 2 === 0, cctv: i % 3 !== 0, fence: true, compound: `${loc.name} ${isDiani ? 'Resort' : 'Homes'}` },
      verified: i % 4 !== 0, rating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), reviews: 5 + (i % 20),
      distanceToUni: parseFloat((loc.dist + (i % 5) * 1.0).toFixed(1)), uniName: 'TUM',
      mpesaTill: `HC00${1000 + id}`, touristFriendly: true,
      beachDistance: isDiani ? parseFloat((0.1 + (i % 5) * 0.3).toFixed(1)) : undefined, createdAt: new Date().toISOString(),
    });
  }

  // Lamu (20)
  for (let i = 0; i < 20; i++) {
    const loc = lamuLocs[i % lamuLocs.length];
    const pt = ptypes[i % ptypes.length];
    const isOT = loc.name.includes('Old Town') || loc.name.includes('Shela');
    props.push({
      id: String(id++), landlordId: `LL${id}`, landlordName: llNames[i % llNames.length],
      landlordRating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), landlordVerified: i % 3 !== 0,
      title: `${pt.type} ${loc.name} ${isOT ? '- Heritage Site' : '- Island Living'}`,
      description: `${pt.desc} in ${loc.name}, Lamu.`,
      price: pt.base + (isOT ? 2000 : 500) + (i % 5) * 500, county: 'Lamu', location: `${loc.name}, Lamu`,
      latitude: loc.lat + (i % 5 - 2) * 0.002, longitude: loc.lng + (i % 5 - 2) * 0.002,
      images: imgSets[i % imgSets.length], bedrooms: pt.bedrooms, bathrooms: pt.bathrooms,
      amenities: amenityLists[i % amenityLists.length],
      security: { score: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), askari24hr: i % 2 === 0, cctv: i % 4 !== 0, fence: i % 2 === 0, compound: `${loc.name} ${i % 2 === 0 ? 'Heritage' : 'Retreat'}` },
      verified: i % 4 !== 0, rating: parseFloat((3.5 + (i % 15) * 0.1).toFixed(1)), reviews: 5 + (i % 15),
      distanceToUni: parseFloat((loc.dist + (i % 5) * 1.5).toFixed(1)), uniName: 'TUM',
      mpesaTill: `HC00${1000 + id}`, touristFriendly: true,
      beachDistance: parseFloat((0.5 + (i % 5) * 0.3).toFixed(1)), createdAt: new Date().toISOString(),
    });
  }

  return props;
}

import express from 'express';
const server = express();

server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

server.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
