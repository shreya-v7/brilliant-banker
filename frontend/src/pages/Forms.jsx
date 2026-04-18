import { useState, useMemo } from 'react'
import {
  FileText,
  CreditCard,
  Building2,
  Truck,
  Landmark,
  Sparkles,
  ArrowLeft,
  Check,
  ChevronRight,
  AlertCircle,
  Zap,
} from 'lucide-react'

const FORM_TEMPLATES = [
  {
    id: 'loc',
    title: 'Business Line of Credit',
    subtitle: 'Revolving credit up to $250K',
    icon: CreditCard,
    color: 'bg-blue-50 text-blue-600',
    badge: 'Popular',
    sections: [
      {
        title: 'Business Information',
        fields: [
          { key: 'business_name', label: 'Legal Business Name', type: 'text', autoKey: 'name' },
          { key: 'business_type', label: 'Business Type / Industry', type: 'text', autoKey: 'business_type' },
          { key: 'ein', label: 'EIN (Tax ID)', type: 'text', placeholder: 'XX-XXXXXXX' },
          { key: 'years_in_business', label: 'Years in Business', type: 'number', placeholder: 'e.g. 5' },
          { key: 'num_employees', label: 'Number of Employees', type: 'number', placeholder: 'e.g. 12' },
          { key: 'business_address', label: 'Business Address', type: 'text', placeholder: '123 Main St, City, State ZIP' },
        ],
      },
      {
        title: 'Financial Information',
        fields: [
          { key: 'annual_revenue', label: 'Annual Revenue', type: 'currency', autoKey: 'annual_revenue' },
          { key: 'monthly_revenue', label: 'Average Monthly Revenue', type: 'currency', autoKey: 'avg_monthly_revenue' },
          { key: 'existing_debt', label: 'Existing Business Debt', type: 'currency', placeholder: '$0' },
          { key: 'requested_amount', label: 'Requested Credit Line Amount', type: 'currency', placeholder: '$25,000' },
        ],
      },
      {
        title: 'Owner Information',
        fields: [
          { key: 'owner_name', label: 'Owner Full Name', type: 'text', autoKey: 'name' },
          { key: 'owner_phone', label: 'Phone Number', type: 'tel', autoKey: 'phone' },
          { key: 'owner_ssn', label: 'SSN (Last 4)', type: 'text', placeholder: 'XXXX' },
          { key: 'ownership_pct', label: 'Ownership Percentage', type: 'number', placeholder: '100' },
        ],
      },
      {
        title: 'Purpose',
        fields: [
          { key: 'purpose', label: 'Purpose of Credit Line', type: 'textarea', placeholder: 'Working capital, inventory, seasonal needs...' },
        ],
      },
    ],
  },
  {
    id: 'sba',
    title: 'SBA 7(a) Loan Application',
    subtitle: 'Government-backed loans up to $5M',
    icon: Landmark,
    color: 'bg-green-50 text-green-600',
    sections: [
      {
        title: 'Business Information',
        fields: [
          { key: 'business_name', label: 'Legal Business Name', type: 'text', autoKey: 'name' },
          { key: 'dba', label: 'DBA (Doing Business As)', type: 'text', placeholder: 'If different from legal name' },
          { key: 'business_type', label: 'Type of Business', type: 'text', autoKey: 'business_type' },
          { key: 'ein', label: 'EIN (Tax ID)', type: 'text', placeholder: 'XX-XXXXXXX' },
          { key: 'date_established', label: 'Date Established', type: 'date' },
          { key: 'business_address', label: 'Business Address', type: 'text', placeholder: '123 Main St, City, State ZIP' },
          { key: 'num_employees', label: 'Number of Employees', type: 'number', placeholder: 'e.g. 12' },
        ],
      },
      {
        title: 'Loan Request',
        fields: [
          { key: 'loan_amount', label: 'Loan Amount Requested', type: 'currency', placeholder: '$50,000' },
          { key: 'loan_purpose', label: 'Loan Purpose', type: 'select', options: [
            'Working Capital', 'Equipment Purchase', 'Real Estate', 'Debt Refinancing', 'Business Acquisition', 'Startup Costs', 'Other',
          ]},
          { key: 'loan_term', label: 'Desired Loan Term', type: 'select', options: ['12 months', '24 months', '36 months', '60 months', '84 months', '120 months'] },
          { key: 'collateral', label: 'Available Collateral', type: 'textarea', placeholder: 'Describe any collateral...' },
        ],
      },
      {
        title: 'Financial Summary',
        fields: [
          { key: 'annual_revenue', label: 'Annual Gross Revenue', type: 'currency', autoKey: 'annual_revenue' },
          { key: 'monthly_revenue', label: 'Average Monthly Revenue', type: 'currency', autoKey: 'avg_monthly_revenue' },
          { key: 'net_income', label: 'Annual Net Income', type: 'currency', placeholder: '$0' },
          { key: 'existing_debt', label: 'Total Existing Debt', type: 'currency', placeholder: '$0' },
        ],
      },
      {
        title: 'Owner / Guarantor',
        fields: [
          { key: 'owner_name', label: 'Full Legal Name', type: 'text', autoKey: 'name' },
          { key: 'owner_phone', label: 'Phone', type: 'tel', autoKey: 'phone' },
          { key: 'owner_ssn', label: 'SSN', type: 'text', placeholder: 'XXX-XX-XXXX' },
          { key: 'ownership_pct', label: 'Ownership %', type: 'number', placeholder: '100' },
          { key: 'personal_credit', label: 'Estimated Credit Score', type: 'number', placeholder: '720' },
        ],
      },
    ],
  },
  {
    id: 'bcc',
    title: 'Business Credit Card',
    subtitle: 'PNC Business Visa with rewards',
    icon: CreditCard,
    color: 'bg-purple-50 text-purple-600',
    sections: [
      {
        title: 'Business Details',
        fields: [
          { key: 'business_name', label: 'Business Name', type: 'text', autoKey: 'name' },
          { key: 'business_type', label: 'Industry', type: 'text', autoKey: 'business_type' },
          { key: 'ein', label: 'EIN', type: 'text', placeholder: 'XX-XXXXXXX' },
          { key: 'annual_revenue', label: 'Annual Revenue', type: 'currency', autoKey: 'annual_revenue' },
        ],
      },
      {
        title: 'Card Preferences',
        fields: [
          { key: 'credit_limit', label: 'Requested Credit Limit', type: 'currency', placeholder: '$10,000' },
          { key: 'num_cards', label: 'Number of Employee Cards', type: 'number', placeholder: '1' },
          { key: 'card_name', label: 'Name on Card', type: 'text', autoKey: 'name' },
        ],
      },
      {
        title: 'Primary Cardholder',
        fields: [
          { key: 'owner_name', label: 'Full Name', type: 'text', autoKey: 'name' },
          { key: 'owner_phone', label: 'Phone', type: 'tel', autoKey: 'phone' },
          { key: 'owner_ssn', label: 'SSN (Last 4)', type: 'text', placeholder: 'XXXX' },
        ],
      },
    ],
  },
  {
    id: 'equip',
    title: 'Equipment Financing',
    subtitle: 'Finance machinery, vehicles, tech',
    icon: Truck,
    color: 'bg-amber-50 text-amber-600',
    sections: [
      {
        title: 'Business Information',
        fields: [
          { key: 'business_name', label: 'Business Name', type: 'text', autoKey: 'name' },
          { key: 'business_type', label: 'Industry', type: 'text', autoKey: 'business_type' },
          { key: 'annual_revenue', label: 'Annual Revenue', type: 'currency', autoKey: 'annual_revenue' },
          { key: 'years_in_business', label: 'Years in Business', type: 'number', placeholder: 'e.g. 5' },
        ],
      },
      {
        title: 'Equipment Details',
        fields: [
          { key: 'equipment_desc', label: 'Equipment Description', type: 'textarea', placeholder: 'Type, make, model...' },
          { key: 'equipment_cost', label: 'Equipment Cost', type: 'currency', placeholder: '$15,000' },
          { key: 'vendor_name', label: 'Vendor / Supplier', type: 'text', placeholder: 'Vendor name' },
          { key: 'new_or_used', label: 'New or Used', type: 'select', options: ['New', 'Used', 'Refurbished'] },
        ],
      },
      {
        title: 'Financing Terms',
        fields: [
          { key: 'down_payment', label: 'Down Payment', type: 'currency', placeholder: '$0' },
          { key: 'loan_term', label: 'Preferred Term', type: 'select', options: ['12 months', '24 months', '36 months', '48 months', '60 months'] },
        ],
      },
      {
        title: 'Contact',
        fields: [
          { key: 'owner_name', label: 'Contact Name', type: 'text', autoKey: 'name' },
          { key: 'owner_phone', label: 'Phone', type: 'tel', autoKey: 'phone' },
        ],
      },
    ],
  },
  {
    id: 'treasury',
    title: 'Treasury Management',
    subtitle: 'Cash management & ACH services',
    icon: Building2,
    color: 'bg-teal-50 text-teal-600',
    sections: [
      {
        title: 'Business Information',
        fields: [
          { key: 'business_name', label: 'Business Name', type: 'text', autoKey: 'name' },
          { key: 'business_type', label: 'Industry', type: 'text', autoKey: 'business_type' },
          { key: 'ein', label: 'EIN', type: 'text', placeholder: 'XX-XXXXXXX' },
          { key: 'annual_revenue', label: 'Annual Revenue', type: 'currency', autoKey: 'annual_revenue' },
          { key: 'monthly_revenue', label: 'Monthly Revenue', type: 'currency', autoKey: 'avg_monthly_revenue' },
        ],
      },
      {
        title: 'Services Requested',
        fields: [
          { key: 'services', label: 'Select Services', type: 'multicheck', options: [
            'ACH Origination', 'Wire Transfers', 'Positive Pay', 'Remote Deposit', 'Sweep Accounts', 'Lockbox Services',
          ]},
          { key: 'monthly_ach_volume', label: 'Est. Monthly ACH Volume', type: 'number', placeholder: 'e.g. 50' },
          { key: 'monthly_wire_volume', label: 'Est. Monthly Wire Volume', type: 'number', placeholder: 'e.g. 5' },
        ],
      },
      {
        title: 'Contact',
        fields: [
          { key: 'owner_name', label: 'Authorized Contact', type: 'text', autoKey: 'name' },
          { key: 'owner_phone', label: 'Phone', type: 'tel', autoKey: 'phone' },
        ],
      },
    ],
  },
]

function fmtCurrency(n) {
  if (!n && n !== 0) return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function buildAutoValues(user) {
  return {
    name: user.name || '',
    business_type: user.business_type || '',
    annual_revenue: fmtCurrency(user.annual_revenue),
    avg_monthly_revenue: fmtCurrency(user.avg_monthly_revenue),
    phone: user.phone || '',
  }
}

function FormField({ field, value, onChange }) {
  const base = `w-full bg-pnc-gray-50 border border-pnc-gray-200 rounded-xl px-3.5 py-2.5 text-sm
                 text-pnc-gray-900 placeholder-pnc-gray-400 outline-none
                 focus:border-pnc-orange/50 focus:ring-2 focus:ring-pnc-orange/10 transition-all`

  if (field.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        rows={3}
        className={`${base} resize-none`}
      />
    )
  }

  if (field.type === 'select') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">Select...</option>
        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  if (field.type === 'multicheck') {
    const selected = value ? value.split(',').filter(Boolean) : []
    const toggle = (opt) => {
      const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]
      onChange(next.join(','))
    }
    return (
      <div className="grid grid-cols-2 gap-2">
        {field.options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-left text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
              selected.includes(opt)
                ? 'bg-pnc-orange/10 border-pnc-orange/40 text-pnc-orange'
                : 'bg-pnc-gray-50 border-pnc-gray-200 text-pnc-gray-600 hover:border-pnc-gray-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  return (
    <input
      type={field.type === 'currency' ? 'text' : field.type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      className={base}
    />
  )
}

function FormView({ template, user, onBack }) {
  const [values, setValues] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [autoFilled, setAutoFilled] = useState(false)

  const autoValues = useMemo(() => buildAutoValues(user), [user])

  const autoFillableCount = useMemo(() => {
    let count = 0
    template.sections.forEach(s => s.fields.forEach(f => { if (f.autoKey) count++ }))
    return count
  }, [template])

  const filledCount = useMemo(() => {
    let count = 0
    template.sections.forEach(s => s.fields.forEach(f => { if (values[f.key]) count++ }))
    return count
  }, [template, values])

  const totalFields = useMemo(() => {
    let count = 0
    template.sections.forEach(s => { count += s.fields.length })
    return count
  }, [template])

  const handleAutoFill = () => {
    const next = { ...values }
    template.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.autoKey && autoValues[field.autoKey]) {
          next[field.key] = autoValues[field.autoKey]
        }
      })
    })
    setValues(next)
    setAutoFilled(true)
  }

  const setValue = (key, val) => setValues(prev => ({ ...prev, [key]: val }))

  if (submitted) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
          <Check size={36} className="text-green-500" />
        </div>
        <h2 className="text-pnc-gray-900 text-xl font-bold mb-2">Application Submitted</h2>
        <p className="text-pnc-gray-500 text-sm max-w-xs mx-auto mb-2">
          Your {template.title} application has been submitted for review.
        </p>
        <p className="text-pnc-gray-400 text-xs mb-8">
          Reference: PNC-{Date.now().toString(36).toUpperCase()}
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-xs mx-auto mb-6">
          <p className="text-blue-800 text-xs font-semibold mb-1">What happens next?</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            Your Relationship Manager will review your application and reach out within 1-2 business days.
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-pnc-orange text-sm font-semibold active:opacity-70"
        >
          Back to Forms
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 pb-8" data-walkthrough="smb-forms">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-pnc-gray-500 text-sm mb-4 active:opacity-70"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${template.color}`}>
          <template.icon size={22} />
        </div>
        <div>
          <h2 className="text-pnc-gray-900 text-lg font-bold">{template.title}</h2>
          <p className="text-pnc-gray-500 text-xs mt-0.5">{template.subtitle}</p>
        </div>
      </div>

      {/* Auto-fill banner */}
      <button
        data-autofill
        onClick={handleAutoFill}
        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border mb-5 text-left transition-all ${
          autoFilled
            ? 'bg-green-50 border-green-200'
            : 'bg-gradient-to-r from-pnc-orange/5 to-amber-50 border-pnc-orange/30 active:bg-pnc-orange/10'
        }`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          autoFilled ? 'bg-green-100' : 'bg-pnc-orange/15'
        }`}>
          {autoFilled
            ? <Check size={18} className="text-green-600" />
            : <Sparkles size={18} className="text-pnc-orange" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${autoFilled ? 'text-green-800' : 'text-pnc-gray-900'}`}>
            {autoFilled ? `${autoFillableCount} fields auto-filled` : 'Auto-fill from your profile'}
          </p>
          <p className={`text-xs mt-0.5 ${autoFilled ? 'text-green-600' : 'text-pnc-gray-500'}`}>
            {autoFilled
              ? 'Review and complete the remaining fields'
              : `Fill ${autoFillableCount} fields instantly from your PNC profile`
            }
          </p>
        </div>
        {!autoFilled && <Zap size={16} className="text-pnc-orange shrink-0" />}
      </button>

      {/* Progress */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-pnc-gray-500 text-[10px] uppercase tracking-wide font-medium">Progress</span>
        <span className="text-pnc-gray-500 text-[10px]">{filledCount}/{totalFields} fields</span>
      </div>
      <div className="w-full bg-pnc-gray-100 rounded-full h-1.5 mb-5">
        <div
          className="bg-pnc-orange h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${totalFields > 0 ? (filledCount / totalFields) * 100 : 0}%` }}
        />
      </div>

      {/* Form sections */}
      <div className="space-y-5">
        {template.sections.map((section, si) => (
          <div key={si} className="bg-white border border-pnc-gray-200 rounded-2xl p-4">
            <h3 className="text-pnc-gray-900 text-sm font-semibold mb-3">{section.title}</h3>
            <div className="space-y-3">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-pnc-gray-700 text-[11px] font-medium">{field.label}</label>
                    {field.autoKey && values[field.key] && (
                      <span className="text-[8px] font-bold text-green-600 bg-green-50 px-1 py-0.5 rounded">
                        AUTO
                      </span>
                    )}
                  </div>
                  <FormField
                    field={field}
                    value={values[field.key] || ''}
                    onChange={(val) => setValue(field.key, val)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 mt-4 mb-4 px-1">
        <AlertCircle size={14} className="text-pnc-gray-400 shrink-0 mt-0.5" />
        <p className="text-pnc-gray-400 text-[10px] leading-relaxed">
          This is a demo application. No real data is transmitted or stored. In production, all data
          would be encrypted and handled per PNC's data security standards.
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={() => setSubmitted(true)}
        className="w-full bg-pnc-orange text-white text-sm font-semibold py-3 rounded-xl
                   active:opacity-90 transition-opacity"
      >
        Submit Application
      </button>
    </div>
  )
}

export default function Forms({ user }) {
  const [activeForm, setActiveForm] = useState(null)

  if (activeForm) {
    return (
      <FormView
        template={activeForm}
        user={user}
        onBack={() => setActiveForm(null)}
      />
    )
  }

  return (
    <div className="px-4 py-4 pb-8" data-walkthrough="smb-forms">
      <div className="mb-5">
        <h2 className="text-pnc-gray-900 text-lg font-bold">Business Forms</h2>
        <p className="text-pnc-gray-500 text-xs mt-1">
          Apply for credit, loans, and services. Auto-fill from your PNC profile.
        </p>
      </div>

      {/* Auto-fill explainer */}
      <div className="bg-gradient-to-r from-pnc-orange/5 to-amber-50 border border-pnc-orange/20 rounded-xl p-3.5 mb-5
                      flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-pnc-orange/15 flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-pnc-orange" />
        </div>
        <div>
          <p className="text-pnc-gray-900 text-sm font-semibold">Smart Auto-Fill</p>
          <p className="text-pnc-gray-500 text-xs mt-0.5">
            Your profile data fills forms instantly  - name, revenue, phone, and more.
          </p>
        </div>
      </div>

      {/* Form list */}
      <div className="space-y-3">
        {FORM_TEMPLATES.map((form) => {
          const Icon = form.icon
          const autoCount = form.sections.reduce(
            (sum, s) => sum + s.fields.filter(f => f.autoKey).length, 0
          )
          return (
            <button
              key={form.id}
              data-form-id={form.id}
              onClick={() => setActiveForm(form)}
              className="w-full bg-white border border-pnc-gray-200 rounded-xl p-4 flex items-center gap-3
                         text-left active:bg-pnc-gray-50 hover:border-pnc-gray-300 transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${form.color}`}>
                <Icon size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-pnc-gray-900 text-sm font-semibold truncate">{form.title}</p>
                  {form.badge && (
                    <span className="text-[8px] font-bold text-pnc-orange bg-pnc-orange/10 px-1.5 py-0.5 rounded-full shrink-0">
                      {form.badge}
                    </span>
                  )}
                </div>
                <p className="text-pnc-gray-500 text-xs mt-0.5">{form.subtitle}</p>
                <p className="text-green-600 text-[10px] font-medium mt-1">
                  {autoCount} fields auto-fillable
                </p>
              </div>
              <ChevronRight size={16} className="text-pnc-gray-400 shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
