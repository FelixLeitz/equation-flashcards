import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { createDeckSchema } from '@flashcards/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateDeck, useUpdateDeck } from './api.js';

/**
 * Create/edit deck dialog.
 * - No `deck` prop -> create mode.
 * - `deck` prop -> edit mode (prefilled).
 */
export function DeckFormDialog({ open, onOpenChange, deck = null }) {
  const isEdit = Boolean(deck);
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(createDeckSchema),
    defaultValues: { title: '', description: '' }
  });

  // Reset form values whenever the dialog opens or the target deck changes.
  useEffect(() => {
    if (open) {
      reset({
        title: deck?.title ?? '',
        description: deck?.description ?? ''
      });
    }
  }, [open, deck, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateDeck.mutateAsync({ id: deck.id, ...values });
        toast.success('Deck updated.');
      } else {
        await createDeck.mutateAsync(values);
        toast.success('Deck created.');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || 'Could not save the deck.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit deck' : 'New deck'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the title or description.'
              : 'Give your deck a title to get started.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              aria-invalid={Boolean(errors.title)}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              rows={3}
              aria-invalid={Boolean(errors.description)}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? 'Save changes' : 'Create deck'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
