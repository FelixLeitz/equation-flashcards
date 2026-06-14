import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner.jsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.jsx';
import { useDecks, useDeleteDeck } from './api.js';
import { DeckCard } from './DeckCard.jsx';
import { DeckFormDialog } from './DeckFormDialog.jsx';

export default function DeckListPage() {
  const { data: decks, isLoading, isError } = useDecks();
  const deleteDeck = useDeleteDeck();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [deletingDeck, setDeletingDeck] = useState(null);

  const openCreate = () => {
    setEditingDeck(null);
    setFormOpen(true);
  };
  const openEdit = (deck) => {
    setEditingDeck(deck);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDeck.mutateAsync(deletingDeck.id);
      toast.success('Deck deleted.');
      setDeletingDeck(null);
    } catch (err) {
      toast.error(err.message || 'Could not delete the deck.');
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (isError) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Could not load your decks. Please refresh and try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Decks</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New deck
        </Button>
      </div>

      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">No decks yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first deck to start studying.
            </p>
          </div>
          <Button onClick={openCreate} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create a deck
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onEdit={openEdit}
              onDelete={setDeletingDeck}
            />
          ))}
        </div>
      )}

      <DeckFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        deck={editingDeck}
      />

      <ConfirmDialog
        open={Boolean(deletingDeck)}
        onOpenChange={(open) => !open && setDeletingDeck(null)}
        title="Delete this deck?"
        description={
          deletingDeck
            ? `"${deletingDeck.title}" and all its cards will be permanently deleted.`
            : ''
        }
        confirmLabel="Delete deck"
        onConfirm={confirmDelete}
        loading={deleteDeck.isPending}
      />
    </div>
  );
}
