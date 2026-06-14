import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Play,
  Pencil,
  Trash2,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/LoadingSpinner.jsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.jsx';
import { useDeck, useDeleteDeck } from './api.js';
import { DeckFormDialog } from './DeckFormDialog.jsx';
import { useDeleteCard } from '@/features/cards/api.js';
import { CardItem } from '@/features/cards/CardItem.jsx';
import { CardEditorDialog } from '@/features/cards/CardEditorDialog.jsx';

export default function DeckDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDeck(id);
  const deleteDeck = useDeleteDeck();
  const deleteCard = useDeleteCard(id);

  const [deckFormOpen, setDeckFormOpen] = useState(false);
  const [deckDeleteOpen, setDeckDeleteOpen] = useState(false);
  const [cardEditorOpen, setCardEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [deletingCard, setDeletingCard] = useState(null);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (isError) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Could not load this deck.{' '}
        <Link to="/decks" className="text-primary underline">
          Back to decks
        </Link>
      </div>
    );
  }

  const { deck, cards } = data;

  const openAddCard = () => {
    setEditingCard(null);
    setCardEditorOpen(true);
  };
  const openEditCard = (card) => {
    setEditingCard(card);
    setCardEditorOpen(true);
  };

  const confirmDeleteDeck = async () => {
    try {
      await deleteDeck.mutateAsync(deck.id);
      toast.success('Deck deleted.');
      navigate('/decks', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Could not delete the deck.');
    }
  };

  const confirmDeleteCard = async () => {
    try {
      await deleteCard.mutateAsync(deletingCard.id);
      toast.success('Card deleted.');
      setDeletingCard(null);
    } catch (err) {
      toast.error(err.message || 'Could not delete the card.');
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild={false}>
        <Link to="/decks" className="inline-flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All decks
        </Link>
      </Button>

      {/* Deck header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{deck.title}</h1>
          {deck.description && (
            <p className="mt-1 text-muted-foreground">{deck.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            onClick={() => navigate(`/decks/${deck.id}/study`)}
            disabled={cards.length === 0}
          >
            <Play className="mr-2 h-4 w-4" />
            Study
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Deck actions</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDeckFormOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit deck
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeckDeleteOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete deck
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cards</h2>
        <Button variant="outline" onClick={openAddCard}>
          <Plus className="mr-2 h-4 w-4" />
          Add card
        </Button>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <p className="font-medium">No cards yet</p>
          <p className="mb-4 text-sm text-muted-foreground">
            Add your first card to start studying.
          </p>
          <Button variant="outline" onClick={openAddCard}>
            <Plus className="mr-2 h-4 w-4" />
            Add a card
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card, index) => (
            <CardItem
              key={card.id}
              card={card}
              index={index}
              onEdit={openEditCard}
              onDelete={setDeletingCard}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <DeckFormDialog
        open={deckFormOpen}
        onOpenChange={setDeckFormOpen}
        deck={deck}
      />
      <CardEditorDialog
        open={cardEditorOpen}
        onOpenChange={setCardEditorOpen}
        deckId={deck.id}
        card={editingCard}
      />
      <ConfirmDialog
        open={deckDeleteOpen}
        onOpenChange={setDeckDeleteOpen}
        title="Delete this deck?"
        description={`"${deck.title}" and all its cards will be permanently deleted.`}
        confirmLabel="Delete deck"
        onConfirm={confirmDeleteDeck}
        loading={deleteDeck.isPending}
      />
      <ConfirmDialog
        open={Boolean(deletingCard)}
        onOpenChange={(open) => !open && setDeletingCard(null)}
        title="Delete this card?"
        description="This card will be permanently deleted."
        confirmLabel="Delete card"
        onConfirm={confirmDeleteCard}
        loading={deleteCard.isPending}
      />
    </div>
  );
}
