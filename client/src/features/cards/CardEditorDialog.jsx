import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { createCardSchema } from '@flashcards/shared';
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
import { Textarea } from '@/components/ui/textarea';
import { LatexRenderer } from '@/components/LatexRenderer.jsx';
import { useCreateCard, useUpdateCard } from './api.js';

/**
 * Create/edit a card. `card` present -> edit mode.
 * Shows a live KaTeX preview of both faces.
 */
export function CardEditorDialog({ open, onOpenChange, deckId, card = null }) {
  const isEdit = Boolean(card);
  const createCard = useCreateCard(deckId);
  const updateCard = useUpdateCard(deckId);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(createCardSchema),
    defaultValues: { front: '', back: '' }
  });

  // Live values for the preview.
  const front = useWatch({ control, name: 'front' });
  const back = useWatch({ control, name: 'back' });

  useEffect(() => {
    if (open) {
      reset({ front: card?.front ?? '', back: card?.back ?? '' });
    }
  }, [open, card, reset]);

  const onSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateCard.mutateAsync({ id: card.id, ...values });
        toast.success('Card updated.');
      } else {
        await createCard.mutateAsync(values);
        toast.success('Card added.');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err.message || 'Could not save the card.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit card' : 'Add card'}</DialogTitle>
          <DialogDescription>
            Use $...$ for inline math and $$...$$ for block math.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* FRONT */}
          <div className="space-y-1.5">
            <Label htmlFor="front">Front</Label>
            <Textarea
              id="front"
              rows={3}
              placeholder="e.g. Derivative of $\sin(x)$?"
              {...register('front')}
            />
            {errors.front && (
              <p className="text-sm text-destructive">{errors.front.message}</p>
            )}
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">
                Preview
              </span>
              <LatexRenderer content={front} />
            </div>
          </div>

          {/* BACK */}
          <div className="space-y-1.5">
            <Label htmlFor="back">Back</Label>
            <Textarea
              id="back"
              rows={3}
              placeholder="e.g. $\cos(x)$"
              {...register('back')}
            />
            {errors.back && (
              <p className="text-sm text-destructive">{errors.back.message}</p>
            )}
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <span className="mb-1 block text-xs text-muted-foreground">
                Preview
              </span>
              <LatexRenderer content={back} />
            </div>
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
              {isEdit ? 'Save changes' : 'Add card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
