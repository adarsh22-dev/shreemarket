/**
 * VendorShared.jsx
 * Shared icons, helpers, formatters
 */

import React from "react";
import {
  Search,
  Download,
  Zap,
  DollarSign,
  Clock,
  AlertCircle,
  Percent,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Star,
  CheckCircle,
  TrendingUp,
  Activity,
  X,
  AlertTriangle,
  Calendar,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Save,
  XCircle,
  FileText,
  Upload,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  ShieldCheck,
  Award,
  Package,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Check,
  Info,
  Bell,
  Settings,
  LogOut,
  Home,
  ChevronDown,
  Lock,
  Unlock,
  Monitor,
  Shirt,
  ShoppingCart,
  Coffee,
  Tag,
  Book,
  Send,
  Store,
  CreditCard,
  PlayCircle,
  Users,
} from "lucide-react";

/* ─────────────────────────────────────────────
   ICON WRAPPER
───────────────────────────────────────────── */

const ICONS = {
  Search,
  Download,
  Zap,
  DollarSign,
  Clock,
  AlertCircle,
  Percent,
  Eye,
  RefreshCw,
  Calendar,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Save,
  XCircle,
  FileText,
  Upload,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Shield,
  ShieldCheck,
  Award,
  Package,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Check,
  Info,
  Bell,
  Settings,
  LogOut,
  Home,
  ChevronDown,
  Lock,
  Unlock,
  Activity,
  X,
  AlertTriangle,
  BarChart: BarChart2,
  BarChart2,
  Star,
  CheckCircle,
  TrendUp: TrendingUp,
  TrendingUp,
  ChevLeft: ChevronLeft,
  ChevRight: ChevronRight,
  Monitor,
  Shirt,
  ShoppingCart,
  Coffee,
  Tag,
  Book,
  Send,
  Store,
  CreditCard,
  PlayCircle,
  Users,
};

export function Icon({ name, size = 16, color = "currentColor", sw = 2 }) {
  const Component = ICONS[name];
  if (!Component) return null;

  return <Component size={size} color={color} strokeWidth={sw} />;
}

/* ─────────────────────────────────────────────
   AVATAR HELPERS
───────────────────────────────────────────── */

const BG_PALETTE = [
  "#E03E1A",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#059669",
  "#dc2626",
  "#6366f1",
];

export function initials(name) {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function avatarBg(name) {
  if (!name) return BG_PALETTE[0];
  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return BG_PALETTE[Math.abs(hash) % BG_PALETTE.length];
}

/* ─────────────────────────────────────────────
   CURRENCY FORMATTER
───────────────────────────────────────────── */

export function fmt(value) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ─────────────────────────────────────────────
   DATE FORMATTER
───────────────────────────────────────────── */

export function fmtDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ─────────────────────────────────────────────
   EXPORT CSV
───────────────────────────────────────────── */

export function exportCSV(rows, filename) {
  if (!rows || !rows.length) return;

  const isArrayOfArrays = Array.isArray(rows[0]);
  const csv = isArrayOfArrays
    ? rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    : rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}