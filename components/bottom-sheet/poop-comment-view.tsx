import { RoundButton } from '@/components/ui/round-button';
import { SheetContentProps, SheetType } from '@/constants/sheet';
import { useSesh } from '@/context/seshContext';
import { useCreatePoopComment } from '@/hooks/api/usePoopCommentsMutations';
import { X } from '@tamagui/lucide-icons';
import { Filter } from 'bad-words';
import { toast } from 'burnt';
import { useState } from 'react';
import { Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Button, Text, TextArea, XStack, YStack } from 'tamagui';

export function PoopCommentView({ setSheetType }: SheetContentProps) {
  const [comment, setComment] = useState('');
  const { mutateAsync: createComment } = useCreatePoopComment();
  const { selectedSesh } = useSesh();
  const [isProfane, setIsProfane] = useState(false);

  const handleSubmit = async () => {
    setIsProfane(false);
    if (!comment.trim() || comment.length > 160) return;

    const filter = new Filter();

    if (filter.isProfane(comment)) {
      setIsProfane(true);
      return;
    }

    try {
      await createComment({ seshId: selectedSesh?.id ?? '', content: comment });
      setComment('');
      setSheetType?.(SheetType.SELECTED_SESH);
      toast({
        title: 'Comment added',
        message: 'Your comment has been added',
        preset: 'done',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error adding comment',
        message: 'Please try again',
        preset: 'error',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} gap='$4' mb='$4'>
        <XStack justify='space-between' items='center'>
          <Text fontWeight='bold'>Add a Comment</Text>
          <RoundButton
            icon={X}
            onPress={() => setSheetType?.(SheetType.SELECTED_SESH)}
          />
        </XStack>
        <TextArea
          value={comment}
          onChangeText={setComment}
          rows={4}
          placeholder='Add a comment...'
          size='$4'
          maxLength={160}
        />
        <Text fontSize='$1' color='$color11'>
          {comment.length}/160
        </Text>
        {isProfane && (
          <Text fontSize='$1' color='$color11'>
            Please remove any offensive words
          </Text>
        )}
        <Button theme='accent' onPress={handleSubmit}>
          Add Comment
        </Button>
      </YStack>
    </KeyboardAvoidingView>
  );
}
