import React from "react";
import { GridListDemo } from "@/components/ui/grid-list-demo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GridListDemoPage: React.FC = () => {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">GridList Component Demo</h1>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic GridList Example</CardTitle>
            <CardDescription>
              A simple grid list with multiple selection enabled
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <GridListDemo />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Information</CardTitle>
            <CardDescription>
              How to implement the GridList component in your application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                The GridList component is built on top of react-aria-components
                and provides a fully accessible grid list with keyboard
                navigation, selection support, and more.
              </p>

              <div className="p-4 bg-muted rounded-md">
                <pre className="text-sm">
                  {`import { GridList, GridListItem } from "@/components/ui/grid-list"

// Basic usage
<GridList aria-label="Favorite pokemon" selectionMode="multiple">
  <GridListItem>Charizard</GridListItem>
  <GridListItem>Blastoise</GridListItem>
  <GridListItem>Venusaur</GridListItem>
  <GridListItem>Pikachu</GridListItem>
</GridList>`}
                </pre>
              </div>

              <h3 className="text-lg font-medium mt-6">Features</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Keyboard navigation</li>
                <li>Multiple selection support</li>
                <li>Accessible by default</li>
                <li>Customizable styling</li>
                <li>Drag and drop support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GridListDemoPage;
