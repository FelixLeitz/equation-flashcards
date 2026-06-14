import { Link } from 'react-router-dom';
import { MoreVertical, Pencil, Trash2, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export function DeckCard({ deck, onEdit, onDelete }) {
  return (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base">
          <Link to={`/decks/${deck.id}`} className="hover:underline">
            {deck.title}
          </Link>
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Deck actions</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(deck)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(deck)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <Link to={`/decks/${deck.id}`} className="block">
          {deck.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {deck.description}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground/60">
              No description
            </p>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
          </p>
        </Link>
      </CardContent>
    </Card>
  );
}
