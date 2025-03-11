import { GridList, GridListItem } from "@/components/ui/grid-list";

export function GridListDemo() {
  return (
    <GridList aria-label="Favorite pokemon" selectionMode="multiple">
      <GridListItem>Charizard</GridListItem>
      <GridListItem>Blastoise</GridListItem>
      <GridListItem>Venusaur</GridListItem>
      <GridListItem>Pikachu</GridListItem>
    </GridList>
  );
}
