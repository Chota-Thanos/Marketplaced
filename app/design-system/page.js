'use client';

import React, { useState } from 'react';
import { Palette, Type, Square, Bell, Sparkles } from 'lucide-react';
import { tokens } from '@ds/tokens';
import { brand } from '@ds/brand';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Modal,
  Drawer,
  Card,
  Panel,
  Badge,
  Alert,
  Skeleton,
  Spinner,
  EmptyState,
  Tabs,
} from '@ds/ui';

/**
 * The design system's visual contract.
 *
 * Every primitive in every state, on one page. Two reasons it exists: a new app
 * can be assembled from what is shown here without reading source, and a token
 * change can be eyeballed against the whole system in one place — including in
 * dark mode, which this page inherits from the theme toggle like any other.
 */

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-sunken text-ink-muted">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-ink">{title}</h2>
          {description && <p className="text-base text-ink-muted mt-0.5">{description}</p>}
        </div>
      </div>
      <Panel className="space-y-6">{children}</Panel>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="space-y-2">
      <p className="text-2xs font-black uppercase tracking-wider text-ink-subtle">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState('all');

  const colorGroups = {
    Surfaces: ['canvas', 'surface', 'surface-muted', 'surface-sunken', 'inverse'],
    Foreground: ['ink', 'ink-muted', 'ink-subtle', 'ink-inverse'],
    Lines: ['line', 'line-strong'],
    Brand: ['primary', 'primary-hover', 'accent', 'accent-hover', 'accent-soft', 'highlight'],
    Status: ['success', 'success-soft', 'warning', 'warning-soft', 'danger', 'danger-soft', 'info', 'info-soft'],
    Commerce: ['sale', 'new', 'rating', 'agent'],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <header className="space-y-2">
        <Badge tone="accent">{brand.name} design system</Badge>
        <h1 className="text-3xl font-black text-ink">Components &amp; tokens</h1>
        <p className="text-md text-ink-muted max-w-2xl">
          Everything below is generated from{' '}
          <code className="font-mono text-sm bg-surface-sunken px-1.5 py-0.5 rounded-chip">
            packages/tokens/src/tokens.js
          </code>
          . Toggle the theme in the navbar — nothing on this page carries a{' '}
          <code className="font-mono text-sm bg-surface-sunken px-1.5 py-0.5 rounded-chip">dark:</code> class.
        </p>
      </header>

      <Section icon={Palette} title="Colour" description="Semantic tokens. Each flips automatically between themes.">
        {Object.entries(colorGroups).map(([group, names]) => (
          <Row key={group} label={group}>
            {names.map((name) => (
              <div key={name} className="space-y-1.5">
                <div
                  className="size-16 rounded-control border border-line"
                  style={{ backgroundColor: `var(--ds-${name})` }}
                />
                <p className="text-2xs font-bold text-ink-muted">{name}</p>
              </div>
            ))}
          </Row>
        ))}
      </Section>

      <Section icon={Type} title="Typography" description="Three families, ten steps. Only loaded families are tokens.">
        <Row label="Families">
          <p className="font-sans text-lg text-ink">Plus Jakarta Sans — font-sans</p>
        </Row>
        <Row label="">
          <p className="font-display text-lg text-ink">Outfit — font-display</p>
        </Row>
        <Row label="">
          <p className="font-mono text-base text-ink">JetBrains Mono — font-mono</p>
        </Row>
        <div className="space-y-1 pt-2">
          {Object.keys(tokens.text).map((step) => (
            <p key={step} className={`text-${step} text-ink`}>
              <span className="font-mono text-xs text-ink-subtle mr-3">text-{step}</span>
              The quick brown fox
            </p>
          ))}
        </div>
      </Section>

      <Section icon={Square} title="Geometry" description="Radii are named by role, not by size.">
        <Row label="Radius">
          {Object.entries(tokens.radius).map(([name, value]) => (
            <div key={name} className="space-y-1.5 text-center">
              <div
                className="size-16 bg-surface-sunken border border-line-strong"
                style={{ borderRadius: value }}
              />
              <p className="text-2xs font-bold text-ink-muted">rounded-{name}</p>
            </div>
          ))}
        </Row>
        <Row label="Elevation">
          {Object.keys(tokens.shadow).map((name) => (
            <div key={name} className="space-y-1.5 text-center">
              <div
                className="size-16 bg-surface rounded-card"
                style={{ boxShadow: `var(--ds-shadow-${name})` }}
              />
              <p className="text-2xs font-bold text-ink-muted">shadow-{name}</p>
            </div>
          ))}
        </Row>
      </Section>

      <Section icon={Sparkles} title="Button" description="One component. Eight variants, four sizes, loading and icon states.">
        <Row label="Variants">
          {['primary', 'secondary', 'accent', 'highlight', 'danger', 'danger-soft', 'ghost', 'link'].map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </Row>
        <Row label="Sizes">
          {['xs', 'sm', 'md', 'lg'].map((s) => (
            <Button key={s} size={s}>
              Size {s}
            </Button>
          ))}
        </Row>
        <Row label="States">
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button leadingIcon={<Bell className="size-4" />}>With icon</Button>
          <Button iconOnly aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <Button shape="rounded">Rounded</Button>
        </Row>
      </Section>

      <Section icon={Square} title="Form controls" description="Label, description, error and aria wiring are automatic — the id comes from useId, so a control cannot be rendered unlabelled.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" placeholder="Priya Sharma" required />
          <Input label="Email" type="email" description="We only use this for order updates." />
          <Input label="Pincode" error="Enter a valid 6-digit pincode." defaultValue="12" />
          <Select label="State" description="Delivery estimates depend on this.">
            <option>Karnataka</option>
            <option>Maharashtra</option>
          </Select>
          <Textarea label="Review" placeholder="What did you think?" wrapperClassName="sm:col-span-2" />
        </div>
        <Checkbox label="Email me about price drops" description="Only for items on a wishlist." />
      </Section>

      <Section icon={Square} title="Containers &amp; feedback">
        <Row label="Badges">
          {['neutral', 'primary', 'accent', 'success', 'warning', 'danger', 'info', 'highlight', 'sale', 'new'].map((t) => (
            <Badge key={t} tone={t}>
              {t}
            </Badge>
          ))}
        </Row>
        <div className="grid gap-3 sm:grid-cols-2">
          <Alert tone="info" title="Heads up">Delivery may take an extra day this week.</Alert>
          <Alert tone="success" title="Order placed">You will get a confirmation shortly.</Alert>
          <Alert tone="warning" title="Low stock">Only 2 left at this price.</Alert>
          <Alert tone="danger" title="Payment failed">Your card was declined.</Alert>
        </div>
        <Row label="Tabs">
          <Tabs
            tabs={[
              { value: 'all', label: 'All', count: 42 },
              { value: 'pending', label: 'Pending', count: 3 },
              { value: 'done', label: 'Delivered', count: 39 },
            ]}
            value={tab}
            onChange={setTab}
          />
        </Row>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card interactive>
            <p className="font-bold text-ink">Interactive card</p>
            <p className="text-base text-ink-muted">Lifts and shadows on hover.</p>
          </Card>
          <Card>
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </Card>
        </div>
        <Row label="Loading">
          <Spinner />
        </Row>
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Order updates and price-drop alerts will show up here."
          action={<Button size="sm">Browse products</Button>}
        />
      </Section>

      <Section icon={Square} title="Overlays" description="Focus trap, Escape, scroll lock and focus restore are built in.">
        <Row label="">
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open drawer
          </Button>
        </Row>
      </Section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm cancellation"
        description="This releases the stock back to inventory."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Keep order
            </Button>
            <Button variant="danger" onClick={() => setModalOpen(false)}>
              Cancel order
            </Button>
          </>
        }
      >
        <p className="text-base text-ink-muted">
          Tab around — focus stays inside this dialog, and returns to the trigger when it closes.
        </p>
      </Modal>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Your cart"
        footer={<Button fullWidth>Checkout</Button>}
      >
        <div className="p-5 space-y-3">
          <p className="text-base text-ink-muted">Same behaviour, anchored to the edge.</p>
        </div>
      </Drawer>
    </div>
  );
}
