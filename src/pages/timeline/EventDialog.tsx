// 事项编辑对话框组件

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { TimelineEvent } from './types';
import { isValidTime } from '@/lib/timeline-utils';
import { Trash2 } from 'lucide-react';

const eventSchema = z.object({
  title: z.string().min(1, '请输入事项名称').max(7, '事项名称最多7个字'),
  startTime: z.string().refine(isValidTime, '请输入有效的时间格式 (HH:mm)'),
  endTime: z.string().refine(isValidTime, '请输入有效的时间格式 (HH:mm)'),
  content: z.string().min(1, '请输入事项内容'),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes > startMinutes;
  },
  {
    message: '结束时间必须晚于开始时间',
    path: ['endTime'],
  }
);

type EventFormValues = z.infer<typeof eventSchema>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: TimelineEvent | null;
  defaultTime?: string;
  onSave: (values: EventFormValues, eventId?: string) => void;
  onDelete?: (eventId: string) => void;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  defaultTime,
  onSave,
  onDelete,
}: EventDialogProps) {
  const isEditMode = !!event;

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      startTime: defaultTime || '09:00',
      endTime: defaultTime ? calculateEndTime(defaultTime) : '10:00',
      content: '',
      notes: '',
    },
  });

  // 当打开对话框时，重置表单
  useEffect(() => {
    if (open) {
      if (event) {
        form.reset({
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          content: event.content,
          notes: event.notes || '',
        });
      } else {
        form.reset({
          title: '',
          startTime: defaultTime || '09:00',
          endTime: defaultTime ? calculateEndTime(defaultTime) : '10:00',
          content: '',
          notes: '',
        });
      }
    }
  }, [open, event, defaultTime, form]);

  const handleSubmit = (values: EventFormValues) => {
    onSave(values, event?.id);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (event && onDelete) {
      onDelete(event.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '编辑事项' : '添加事项'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '修改事项详情' : '创建一个新的时间表事项'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>事项名称</FormLabel>
                  <FormControl>
                    <Input placeholder="最多7个字" maxLength={7} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>开始时间</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>结束时间</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>事项内容</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="描述这个事项的具体内容..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>事项备注（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="添加额外的备注信息..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              {isEditMode && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit">
                {isEditMode ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// 辅助函数：计算默认结束时间（开始时间+1小时）
function calculateEndTime(startTime: string): string {
  const [hour, minute] = startTime.split(':').map(Number);
  const endHour = (hour + 1) % 24;
  return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}
