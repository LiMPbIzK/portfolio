import { t, type Locale } from '../i18n/utils';

function currentLocale(): Locale {
  return (document.documentElement.getAttribute('data-locale') ?? 'es') as Locale;
}

function copyText(text: string): Promise<void> {
  const clipboard = navigator.clipboard;
  if (clipboard?.writeText) {
    return clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const exec = (document as unknown as { execCommand: (commandId: string) => boolean }).execCommand;
      exec('copy') ? resolve() : reject(new Error('copy failed'));
    } catch (error) {
      reject(error);
    } finally {
      textarea.remove();
    }
  });
}

function attach(block: HTMLPreElement): void {
  if (block.querySelector('.copy-code-btn')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-code-btn';
  button.textContent = t(currentLocale(), 'tutorials.copyCode');
  button.setAttribute('aria-label', t(currentLocale(), 'tutorials.copyCode'));

  button.addEventListener('click', () => {
    const code = block.querySelector('code');
    const text = code?.innerText ?? block.innerText;
    copyText(text)
      .then(() => {
        button.textContent = t(currentLocale(), 'tutorials.copied');
        button.setAttribute('aria-label', t(currentLocale(), 'tutorials.copied'));
        window.setTimeout(() => {
          button.textContent = t(currentLocale(), 'tutorials.copyCode');
          button.setAttribute('aria-label', t(currentLocale(), 'tutorials.copyCode'));
        }, 2000);
      })
      .catch(() => {
        button.textContent = t(currentLocale(), 'tutorials.copyCode');
      });
  });

  block.appendChild(button);
}

function init(): void {
  document.querySelectorAll<HTMLPreElement>('.prose pre.astro-code').forEach(attach);
}

document.addEventListener('astro:page-load', init);

init();
