import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Clipboard,
  Code2,
  Database,
  ExternalLink,
  Github,
  KeyRound,
  Layers3,
  Menu,
  PackageOpen,
  Search,
  Share2,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import templateData from './generated/templates.json';
import { ALL_FILTER, filterTemplates, uniqueSorted } from './lib/gallery';
import type { GalleryTemplate } from './types';

const templates = templateData as GalleryTemplate[];
const repositoryUrl = 'https://github.com/mksuni/awesome-rayfin';
const contributionUrl = `${repositoryUrl}/issues/new?template=new-template-proposal.yml`;
const galleryCommand =
  'npm create @microsoft/rayfin -- --template https://github.com/mksuni/awesome-rayfin';

type CopyStatus = { key: string; message: string; error: boolean } | null;

function CopyButton({
  copyKey,
  text,
  label,
  copiedKey,
  onCopy,
  compact = false,
}: {
  copyKey: string;
  text: string;
  label: string;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  compact?: boolean;
}) {
  const copied = copiedKey === copyKey;

  return (
    <button
      className={compact ? 'icon-button' : 'copy-button'}
      type="button"
      onClick={() => onCopy(copyKey, text)}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      {copied ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
      {!compact && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}

function ServiceIcon({ capability }: { capability: string }) {
  if (capability === 'Authentication') return <KeyRound aria-hidden="true" />;
  if (capability === 'Data API') return <Database aria-hidden="true" />;
  if (capability === 'Microsoft Fabric') return <Layers3 aria-hidden="true" />;
  return <Zap aria-hidden="true" />;
}

function TemplateCard({
  template,
  index,
  copiedKey,
  onCopy,
  onShare,
}: {
  template: GalleryTemplate;
  index: number;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onShare: (template: GalleryTemplate) => void;
}) {
  const previewUrl = template.previewImage
    ? `${import.meta.env.BASE_URL}${template.previewImage}`
    : null;

  return (
    <article
      className="template-card"
      id={`template-${template.id}`}
      style={{ '--card-index': index } as React.CSSProperties}
    >
      <div className={`card-visual theme-${index % 5}`}>
        {previewUrl ? (
          <img src={previewUrl} alt="" loading="lazy" />
        ) : (
          <div className="visual-fallback" aria-hidden="true">
            <span className="visual-orbit orbit-one" />
            <span className="visual-orbit orbit-two" />
            <span className="visual-mark">{template.id.charAt(0).toUpperCase()}</span>
            <Code2 />
          </div>
        )}
        <div className="visual-overlay">
          <div className="stack-row">
            {template.stacks.slice(0, 3).map((stack) => (
              <span key={stack}>{stack}</span>
            ))}
          </div>
          {template.experimental && <span className="experimental">Experimental</span>}
        </div>
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <div>
            <p className="eyebrow">{template.id}</p>
            <h3>{template.displayName}</h3>
          </div>
          <button
            className="icon-button share-button"
            type="button"
            onClick={() => onShare(template)}
            aria-label={`Copy link to ${template.displayName}`}
          >
            <Share2 aria-hidden="true" />
          </button>
        </div>

        <p className="card-description">{template.description}</p>

        <div className="capability-list" aria-label="Capabilities">
          {template.capabilities.map((capability) => (
            <span className="capability" key={capability}>
              <ServiceIcon capability={capability} />
              {capability}
            </span>
          ))}
        </div>

        <div className="command-block">
          <div className="command-label">
            <span>Scaffold this template</span>
            <CopyButton
              copyKey={`template-${template.id}`}
              text={template.scaffoldCommand}
              label="Copy command"
              copiedKey={copiedKey}
              onCopy={onCopy}
              compact
            />
          </div>
          <code>
            <span aria-hidden="true">$</span> {template.scaffoldCommand}
          </code>
        </div>

        <div className="card-footer">
          <a href={template.sourceUrl} target="_blank" rel="noreferrer">
            <Github aria-hidden="true" />
            View source
            <ExternalLink aria-hidden="true" />
          </a>
          <span>{template.path}</span>
        </div>
      </div>
    </article>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [capability, setCapability] = useState(ALL_FILTER);
  const [stack, setStack] = useState(ALL_FILTER);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const capabilities = useMemo(
    () => uniqueSorted(templates.map((template) => template.capabilities)),
    [],
  );
  const stacks = useMemo(
    () => uniqueSorted(templates.map((template) => template.stacks)),
    [],
  );
  const filteredTemplates = useMemo(
    () => filterTemplates(templates, { query, capability, stack }),
    [query, capability, stack],
  );

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (
        event.key === '/' &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) return;
    window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'center' });
    });
  }, []);

  useEffect(() => {
    if (!copyStatus) return;
    const timeout = window.setTimeout(() => setCopyStatus(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [copyStatus]);

  const copyText = async (key: string, text: string, message = 'Command copied') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus({ key, message, error: false });
    } catch {
      setCopyStatus({
        key: '',
        message: 'Clipboard access was blocked. Select and copy the command manually.',
        error: true,
      });
    }
  };

  const shareTemplate = (template: GalleryTemplate) => {
    const url = new URL(window.location.href);
    url.hash = `template-${template.id}`;
    window.history.replaceState(null, '', url);
    void copyText(`share-${template.id}`, url.toString(), 'Template link copied');
  };

  const resetFilters = () => {
    setQuery('');
    setCapability(ALL_FILTER);
    setStack(ALL_FILTER);
    searchRef.current?.focus();
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#templates">
        Skip to templates
      </a>

      <header className="site-header">
        <a className="brand" href="#" aria-label="Awesome Rayfin home">
          <img src={`${import.meta.env.BASE_URL}gallery-mark.svg`} alt="" />
          <span>
            <strong>Awesome</strong> Rayfin
          </span>
          <span className="community-pill">Community</span>
        </a>

        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          id="primary-navigation"
          className={mobileNavOpen ? 'nav-links nav-open' : 'nav-links'}
          aria-label="Primary navigation"
        >
          <a href="#templates" onClick={() => setMobileNavOpen(false)}>
            Templates
          </a>
          <a href="#how-it-works" onClick={() => setMobileNavOpen(false)}>
            How it works
          </a>
          <a href={contributionUrl} target="_blank" rel="noreferrer">
            Contribute
          </a>
          <a className="github-button" href={repositoryUrl} target="_blank" rel="noreferrer">
            <Github aria-hidden="true" />
            GitHub
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />
          <div className="hero-grid" />

          <div className="hero-copy">
            <div className="hero-kicker">
              <Sparkles aria-hidden="true" />
              Community-built for Rayfin + Microsoft Fabric
            </div>
            <h1>
              Start with a template.
              <span> Ship with confidence.</span>
            </h1>
            <p>
              Discover production-minded starters, apps, and Fabric solutions built on
              Rayfin conventions. Pick a template and scaffold a working project in one
              command.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#templates">
                Explore templates
                <ArrowRight aria-hidden="true" />
              </a>
              <a className="secondary-action" href={contributionUrl} target="_blank" rel="noreferrer">
                Submit your template
              </a>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>{templates.length}</dt>
                <dd>Community templates</dd>
              </div>
              <div>
                <dt>{capabilities.length}</dt>
                <dd>Rayfin capabilities</dd>
              </div>
              <div>
                <dt>1</dt>
                <dd>Command to begin</dd>
              </div>
            </dl>
          </div>

          <div className="terminal-wrap" aria-label="Rayfin quick start">
            <div className="terminal">
              <div className="terminal-bar">
                <div className="terminal-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <span>rayfin · quick start</span>
                <CopyButton
                  copyKey="hero-command"
                  text={galleryCommand}
                  label="Copy"
                  copiedKey={copyStatus?.key ?? null}
                  onCopy={copyText}
                />
              </div>
              <div className="terminal-content">
                <p className="terminal-comment"># Choose from every template in this gallery</p>
                <code>
                  <span className="prompt">$</span> npm create{' '}
                  <span className="terminal-accent">@microsoft/rayfin</span> -- --template \
                  <br />
                  <span className="terminal-url">https://github.com/mksuni/awesome-rayfin</span>
                </code>
                <div className="terminal-result">
                  <span><Check aria-hidden="true" /> Gallery loaded</span>
                  <span><ChevronRight aria-hidden="true" /> Select a template</span>
                </div>
              </div>
            </div>
            <div className="terminal-orbit orbit-a" />
            <div className="terminal-orbit orbit-b" />
          </div>
        </section>

        <section className="trust-strip" aria-label="Gallery qualities">
          <span><CircleDot aria-hidden="true" /> Manifest-driven</span>
          <span><CircleDot aria-hidden="true" /> Rayfin static hosting</span>
          <span><CircleDot aria-hidden="true" /> Fabric-ready</span>
          <span><CircleDot aria-hidden="true" /> Open source</span>
        </section>

        <section className="gallery-section" id="templates">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Template explorer</p>
              <h2>Find your starting point</h2>
              <p>
                Search by use case or narrow the collection by Rayfin capability and
                application stack.
              </p>
            </div>
            <span className="result-count" aria-live="polite">
              {filteredTemplates.length} of {templates.length} templates
            </span>
          </div>

          <div className="filter-panel">
            <label className="search-field">
              <span className="sr-only">Search templates</span>
              <Search aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                aria-label="Search templates"
                placeholder="Search templates, stacks, or capabilities..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                  <X aria-hidden="true" />
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </label>

            <label className="select-field">
              <span>Stack</span>
              <select value={stack} onChange={(event) => setStack(event.target.value)}>
                <option>{ALL_FILTER}</option>
                {stacks.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="capability-filters" aria-label="Filter by capability">
            {[ALL_FILTER, ...capabilities].map((item) => (
              <button
                key={item}
                type="button"
                className={capability === item ? 'active' : ''}
                aria-pressed={capability === item}
                onClick={() => setCapability(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="template-grid">
              {filteredTemplates.map((template, index) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  index={index}
                  copiedKey={copyStatus?.key ?? null}
                  onCopy={copyText}
                  onShare={shareTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div><PackageOpen aria-hidden="true" /></div>
              <h3>No templates match yet</h3>
              <p>
                Try a broader search or reset the filters to explore the full gallery.
              </p>
              <button type="button" onClick={resetFilters}>
                Reset all filters
              </button>
            </div>
          )}
        </section>

        <section className="workflow-section" id="how-it-works">
          <div className="section-heading workflow-heading">
            <div>
              <p className="eyebrow">Built the Rayfin way</p>
              <h2>From discovery to deployment</h2>
            </div>
          </div>
          <div className="workflow-grid">
            <article>
              <span>01</span>
              <Search aria-hidden="true" />
              <h3>Discover</h3>
              <p>Compare real apps by stack, service, and Fabric capability.</p>
            </article>
            <article>
              <span>02</span>
              <Code2 aria-hidden="true" />
              <h3>Scaffold</h3>
              <p>Copy a generated Rayfin CLI command for the exact template you want.</p>
            </article>
            <article>
              <span>03</span>
              <Zap aria-hidden="true" />
              <h3>Ship</h3>
              <p>Build on typed Rayfin services and deploy through static hosting.</p>
            </article>
          </div>
        </section>

        <section className="contribute-section">
          <div className="contribute-art" aria-hidden="true">
            <span className="contribute-ring ring-one" />
            <span className="contribute-ring ring-two" />
            <img src={`${import.meta.env.BASE_URL}gallery-mark.svg`} alt="" />
          </div>
          <div>
            <p className="eyebrow">Grow the ecosystem</p>
            <h2>Built something great with Rayfin?</h2>
            <p>
              Share it with the community. Propose a template, follow the contribution
              guidelines, and help the next builder start further ahead.
            </p>
          </div>
          <div className="contribute-actions">
            <a className="primary-action" href={contributionUrl} target="_blank" rel="noreferrer">
              Propose a template
              <ArrowRight aria-hidden="true" />
            </a>
            <a href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">
              Read contribution guide
            </a>
          </div>
        </section>
      </main>

      <footer>
        <a className="brand footer-brand" href="#">
          <img src={`${import.meta.env.BASE_URL}gallery-mark.svg`} alt="" />
          <span><strong>Awesome</strong> Rayfin</span>
        </a>
        <p>Community-curated templates for Project Rayfin and Microsoft Fabric.</p>
        <div>
          <a href={`${repositoryUrl}/blob/main/LICENSE`} target="_blank" rel="noreferrer">MIT License</a>
          <a href={repositoryUrl} target="_blank" rel="noreferrer">GitHub</a>
          <a href={`${repositoryUrl}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer">Contribute</a>
        </div>
      </footer>

      <div
        className={copyStatus ? `toast visible ${copyStatus.error ? 'toast-error' : ''}` : 'toast'}
        role="status"
        aria-live="polite"
      >
        {copyStatus?.error ? <X aria-hidden="true" /> : <Check aria-hidden="true" />}
        {copyStatus?.message}
      </div>
    </div>
  );
}
