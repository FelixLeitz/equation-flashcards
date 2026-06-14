import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LatexRenderer } from '../LatexRenderer.jsx';

describe('LatexRenderer', () => {
  it('renders plain text', () => {
    const { container } = render(<LatexRenderer content="Hello world" />);
    expect(container.textContent).toContain('Hello world');
  });

  it('renders an empty placeholder for empty content', () => {
    const { container } = render(<LatexRenderer content="" />);
    expect(container.textContent).toContain('(empty)');
  });

  it('renders inline math via KaTeX', () => {
    const { container } = render(
      <LatexRenderer content="Value is $x^2$ here" />
    );
    expect(container.querySelector('.katex')).toBeTruthy();
    expect(container.textContent).toContain('Value is');
    expect(container.textContent).toContain('here');
  });

  it('renders block math via KaTeX', () => {
    const { container } = render(
      <LatexRenderer content="$$\\int_0^1 x\\,dx$$" />
    );
    expect(container.querySelector('.katex-display, .katex')).toBeTruthy();
  });

  it('renders mixed plain text and inline math', () => {
    const { container } = render(
      <LatexRenderer content="The derivative of $\\sin(x)$ is $\\cos(x)$." />
    );
    expect(container.textContent).toContain('The derivative of');
    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(0);
  });

  it('does not crash on malformed LaTeX (REQ-STUDY-006)', () => {
    expect(() =>
      render(<LatexRenderer content="$\\frac{1}{$" />)
    ).not.toThrow();
  });

  it('escapes plain text (no raw HTML injection)', () => {
    const { container } = render(
      <LatexRenderer content="<img src=x onerror=alert(1)>" />
    );
    expect(container.querySelector('img')).toBeFalsy();
    expect(container.textContent).toContain('<img');
  });
});
