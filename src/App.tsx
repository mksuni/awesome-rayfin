import {
  Badge,
  Button,
  Card,
  FluentProvider,
  Input,
  Select,
  Tooltip,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components';
import {
  ArrowRightRegular,
  CheckmarkRegular,
  ChevronRightRegular,
  CircleRegular,
  ClipboardRegular,
  CodeRegular,
  DatabaseRegular,
  DismissRegular,
  FlashRegular,
  KeyRegular,
  LayerRegular,
  NavigationRegular,
  OpenRegular,
  SearchRegular,
  ShareRegular,
  SparkleRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from '@fluentui/react-icons';
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
type ThemeMode = 'light' | 'dark';

function initialTheme(): ThemeMode {
  let storedTheme: string | null = null;
  try {
    storedTheme = window.localStorage.getItem('awesome-rayfin-theme');
  } catch (error) {
    console.warn('Unable to read the saved theme preference.', error);
  }
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

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
    <Button
      className={compact ? 'icon-button' : 'copy-button'}
      appearance="subtle"
      size="small"
      icon={copied ? <CheckmarkRegular /> : <ClipboardRegular />}
      onClick={() => onCopy(copyKey, text)}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      {!compact && <span>{copied ? 'Copied' : label}</span>}
    </Button>
  );
}

function ServiceIcon({ capability }: { capability: string }) {
  if (capability === 'Authentication') return <KeyRegular aria-hidden="true" />;
  if (capability === 'Data API') return <DatabaseRegular aria-hidden="true" />;
  if (capability === 'Microsoft Fabric') return <LayerRegular aria-hidden="true" />;
  return <FlashRegular aria-hidden="true" />;
}

function TemplateCard({
  template,
  copiedKey,
  onCopy,
  onShare,
}: {
  template: GalleryTemplate;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onShare: (template: GalleryTemplate) => void;
}) {
  return (
    <Card
      role="article"
      className="template-card"
      id={`template-${template.id}`}
    >
      <div className="card-body">
        <div className="card-meta">
          <div className="stack-row">
            {template.stacks.map((stack) => (
              <Badge appearance="tint" key={stack}>{stack}</Badge>
            ))}
          </div>
          {template.experimental && (
            <Badge appearance="tint" color="warning">
              Experimental
            </Badge>
          )}
        </div>
        <div className="card-title-row">
          <div>
            <p className="eyebrow">{template.id}</p>
            <h3>{template.displayName}</h3>
          </div>
          <Tooltip content={`Copy link to ${template.displayName}`} relationship="label">
            <Button
              className="icon-button share-button"
              appearance="subtle"
              size="small"
              icon={<ShareRegular />}
              onClick={() => onShare(template)}
              aria-label={`Copy link to ${template.displayName}`}
            />
          </Tooltip>
        </div>

        <p className="card-description">{template.description}</p>

        <div className="capability-list" aria-label="Capabilities">
          {template.capabilities.map((capability) => (
            <Badge appearance="outline" className="capability" key={capability}>
              <ServiceIcon capability={capability} />
              {capability}
            </Badge>
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
            <CodeRegular aria-hidden="true" />
            View source
            <OpenRegular aria-hidden="true" />
          </a>
          <span>{template.path}</span>
        </div>
      </div>
    </Card>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [capability, setCapability] = useState(ALL_FILTER);
  const [stack, setStack] = useState(ALL_FILTER);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme);
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
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
    try {
      window.localStorage.setItem('awesome-rayfin-theme', themeMode);
    } catch (error) {
      console.warn('Unable to save the theme preference.', error);
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', themeMode === 'dark' ? '#07172d' : '#f5f5f5');
  }, [themeMode]);

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
    <FluentProvider
      className="fluent-root"
      theme={themeMode === 'dark' ? webDarkTheme : webLightTheme}
    >
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

        <Button
          className="mobile-menu-button"
          appearance="subtle"
          icon={mobileNavOpen ? <DismissRegular /> : <NavigationRegular />}
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-expanded={mobileNavOpen}
          aria-controls="primary-navigation"
          aria-label="Toggle navigation"
        />

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
          <Tooltip
            content={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
            relationship="label"
          >
            <Button
              className="theme-toggle"
              appearance="subtle"
              icon={themeMode === 'dark' ? <WeatherSunnyRegular /> : <WeatherMoonRegular />}
              onClick={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
              aria-label={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
            />
          </Tooltip>
          <a className="github-button" href={repositoryUrl} target="_blank" rel="noreferrer">
            <CodeRegular aria-hidden="true" />
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
              <SparkleRegular aria-hidden="true" />
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
                <ArrowRightRegular aria-hidden="true" />
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
                  <span><CheckmarkRegular aria-hidden="true" /> Gallery loaded</span>
                  <span><ChevronRightRegular aria-hidden="true" /> Select a template</span>
                </div>
              </div>
            </div>
            <div className="terminal-orbit orbit-a" />
            <div className="terminal-orbit orbit-b" />
          </div>
        </section>

        <section className="trust-strip" aria-label="Gallery qualities">
          <span><CircleRegular aria-hidden="true" /> Manifest-driven</span>
          <span><CircleRegular aria-hidden="true" /> Rayfin static hosting</span>
          <span><CircleRegular aria-hidden="true" /> Fabric-ready</span>
          <span><CircleRegular aria-hidden="true" /> Open source</span>
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
            <Input
              className="search-field"
              ref={searchRef}
              type="search"
              aria-label="Search templates"
              placeholder="Search templates, stacks, or capabilities..."
              value={query}
              contentBefore={<SearchRegular />}
              contentAfter={
                query ? (
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DismissRegular />}
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                  />
                ) : (
                  <kbd>/</kbd>
                )
              }
              onChange={(_, data) => setQuery(data.value)}
            />

            <label className="select-field">
              <span>Stack</span>
              <Select value={stack} onChange={(_, data) => setStack(data.value)}>
                <option>{ALL_FILTER}</option>
                {stacks.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </Select>
            </label>
          </div>

          <div className="capability-filters" aria-label="Filter by capability">
            {[ALL_FILTER, ...capabilities].map((item) => (
              <Button
                key={item}
                appearance={capability === item ? 'primary' : 'subtle'}
                shape="circular"
                size="small"
                className={capability === item ? 'active' : ''}
                aria-pressed={capability === item}
                onClick={() => setCapability(item)}
              >
                {item}
              </Button>
            ))}
          </div>

          {filteredTemplates.length > 0 ? (
            <div className="template-grid">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  copiedKey={copyStatus?.key ?? null}
                  onCopy={copyText}
                  onShare={shareTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div><LayerRegular aria-hidden="true" /></div>
              <h3>No templates match yet</h3>
              <p>
                Try a broader search or reset the filters to explore the full gallery.
              </p>
              <Button appearance="primary" onClick={resetFilters}>
                Reset all filters
              </Button>
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
              <SearchRegular aria-hidden="true" />
              <h3>Discover</h3>
              <p>Compare real apps by stack, service, and Fabric capability.</p>
            </article>
            <article>
              <span>02</span>
              <CodeRegular aria-hidden="true" />
              <h3>Scaffold</h3>
              <p>Copy a generated Rayfin CLI command for the exact template you want.</p>
            </article>
            <article>
              <span>03</span>
              <FlashRegular aria-hidden="true" />
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
              <ArrowRightRegular aria-hidden="true" />
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
        {copyStatus?.error ? <DismissRegular aria-hidden="true" /> : <CheckmarkRegular aria-hidden="true" />}
        {copyStatus?.message}
      </div>
    </div>
    </FluentProvider>
  );
}
