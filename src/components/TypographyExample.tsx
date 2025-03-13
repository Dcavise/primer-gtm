import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TypographyExample: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Typography Plugin Example</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Basic prose class */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Basic Typography</h2>
            <div className="prose">
              <h1>This is a heading 1</h1>
              <h2>This is a heading 2</h2>
              <h3>This is a heading 3</h3>
              <p>
                This is a regular paragraph with <strong>bold text</strong> and{" "}
                <em>italic text</em>. The typography plugin automatically styles
                these elements with proper spacing, font sizes, and line heights.
              </p>
              <blockquote>
                This is a blockquote. It will be styled with a nice border and
                padding.
              </blockquote>
              <ul>
                <li>This is a list item</li>
                <li>This is another list item</li>
                <li>
                  This is a list item with a nested list
                  <ul>
                    <li>Nested list item 1</li>
                    <li>Nested list item 2</li>
                  </ul>
                </li>
              </ul>
              <p>
                Here's a link to{" "}
                <a href="https://tailwindcss.com/docs/typography-plugin">
                  Tailwind CSS Typography Plugin
                </a>{" "}
                documentation.
              </p>
              <pre>
                <code>
                  {`// This is a code block
function example() {
  return "Hello, world!";
}`}
                </code>
              </pre>
            </div>
          </div>

          {/* Different sizes */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Different Sizes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="prose prose-sm">
                <h3>Small Typography (prose-sm)</h3>
                <p>
                  This uses the prose-sm class for smaller text. Good for
                  sidebars or less important content.
                </p>
                <ul>
                  <li>Smaller list item</li>
                  <li>Another smaller list item</li>
                </ul>
              </div>
              <div className="prose">
                <h3>Default Typography</h3>
                <p>
                  This uses the default prose class. Good for most content on
                  your site.
                </p>
                <ul>
                  <li>Regular list item</li>
                  <li>Another regular list item</li>
                </ul>
              </div>
              <div className="prose prose-lg">
                <h3>Large Typography (prose-lg)</h3>
                <p>
                  This uses the prose-lg class for larger text. Good for
                  featured content or articles.
                </p>
                <ul>
                  <li>Larger list item</li>
                  <li>Another larger list item</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Different colors */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Different Colors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="prose prose-indigo">
                <h3>Indigo Theme (prose-indigo)</h3>
                <p>
                  This uses the prose-indigo class to style links and other
                  elements with indigo colors.
                </p>
                <a href="#">This is an indigo-styled link</a>
                <blockquote>This blockquote has indigo accents</blockquote>
              </div>
              <div className="prose prose-pink">
                <h3>Pink Theme (prose-pink)</h3>
                <p>
                  This uses the prose-pink class to style links and other
                  elements with pink colors.
                </p>
                <a href="#">This is a pink-styled link</a>
                <blockquote>This blockquote has pink accents</blockquote>
              </div>
            </div>
          </div>

          {/* Dark mode */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Dark Mode</h2>
            <div className="p-6 bg-gray-900 rounded-lg">
              <div className="prose prose-invert">
                <h3>Dark Mode Typography (prose-invert)</h3>
                <p>
                  This uses the prose-invert class to style text for dark
                  backgrounds. All the colors are adjusted for better
                  readability.
                </p>
                <a href="#">This is a link styled for dark mode</a>
                <ul>
                  <li>Dark mode list item</li>
                  <li>Another dark mode list item</li>
                </ul>
                <blockquote>
                  This blockquote is styled for dark backgrounds
                </blockquote>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TypographyExample;
