import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../../services/api';
import {
  SignageContent,
  CreateSignageContentDto,
  UpdateSignageContentDto,
  ContentType,
} from '@shared/types';
import toast, { Toaster } from 'react-hot-toast';
import { Modal } from '../shared/Modal';
import { LoadingState } from '../shared/LoadingState';
import { ErrorState } from '../shared/ErrorState';
import { config } from '../../config';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';

export const ContentManager = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<SignageContent | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterText, setFilterText] = useState('');

  const {
    data: content,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      const response = await contentApi.getAll();
      return response.data as SignageContent[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSignageContentDto) => contentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      setIsFormOpen(false);
      toast.success('Content created successfully!');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to create content'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSignageContentDto }) =>
      contentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      setEditingContent(null);
      setIsFormOpen(false);
      toast.success('Content updated successfully!');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update content'));
    },
  });

  const { mutate: deleteContent } = useMutation({
    mutationFn: (id: number) => contentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
      toast.success('Content deleted successfully!');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to delete content'));
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const contentData = {
      title: formData.get('title') as string,
      filePath: formData.get('filePath') as string,
      isActive: formData.get('isActive') === 'on',
      order: Number.parseInt(formData.get('order') as string) || 0,
    };

    if (editingContent) {
      updateMutation.mutate({ id: editingContent.id, data: contentData });
    } else {
      createMutation.mutate(contentData as CreateSignageContentDto);
    }
  };

  const handleEdit = useCallback((content: SignageContent) => {
    setEditingContent(content);
    setUploadedFilePath('');
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: number) => {
      if (
        confirm(
          'Are you sure you want to delete this content? This will also delete the associated file.',
        )
      ) {
        deleteContent(id);
      }
    },
    [deleteContent],
  );

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingContent(null);
    setUploadedFilePath('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const response = await contentApi.upload(file);
      setUploadedFilePath(response.data.filePath);
      // Update the filePath input value
      const filePathInput = document.querySelector<HTMLInputElement>('input[name="filePath"]');
      if (filePathInput) {
        filePathInput.value = response.data.filePath;
      }
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(getApiErrorMessage(error, 'Failed to upload file'));
    } finally {
      setIsUploading(false);
    }
  };

  // Define table columns
  const columns = useMemo<ColumnDef<SignageContent>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue() as string}</div>
        ),
      },
      {
        accessorKey: 'contentType',
        header: 'Type',
        cell: (info) => {
          const type = info.getValue() as ContentType;
          const typeColors: Record<ContentType, string> = {
            [ContentType.IMAGE]: 'bg-blue-100 text-blue-800',
            [ContentType.VIDEO]: 'bg-purple-100 text-purple-800',
            [ContentType.PLAYER_STATS]: 'bg-green-100 text-green-800',
          };
          return (
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${typeColors[type]}`}>
              {type}
            </span>
          );
        },
      },
      {
        accessorKey: 'order',
        header: 'Priority',
        cell: (info) => <span className="text-sm text-gray-500">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Active',
        cell: (info) =>
          info.getValue() ? (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
              Inactive
            </span>
          ),
      },
      {
        accessorKey: 'filePath',
        header: 'File',
        cell: (info) => {
          const filePath = info.getValue() as string | undefined;
          return filePath ? (
            <a
              href={`${config.apiUrl}${filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-900 text-sm"
            >
              View
            </a>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: (info) => (
          <span className="text-sm text-gray-500">
            {new Date(info.getValue() as string).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const content = info.row.original;
          return (
            <div className="text-right text-sm font-medium space-x-2">
              <button
                onClick={() => handleEdit(content)}
                className="text-blue-600 hover:text-blue-900 p-1"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(content.id)}
                className="text-red-600 hover:text-red-900 p-1"
                title="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          );
        },
      },
    ],
    [handleDelete, handleEdit],
  );

  const table = useReactTable({
    data: content || [],
    columns,
    state: {
      sorting,
      globalFilter: filterText,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFilterText,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return (
      <>
        <LoadingState fullScreen message="Loading content..." />
        <Toaster position="top-right" />
      </>
    );
  }

  if (isError) {
    return (
      <>
        <ErrorState
          fullScreen
          message={getApiErrorMessage(error, 'Failed to load content')}
          onRetry={() => refetch()}
        />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Content Manager
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Manage signage display content
              </p>
            </div>
            <a
              href="/admin"
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-center whitespace-nowrap"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Filter by title..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg flex-1 text-sm sm:text-base"
            />
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold whitespace-nowrap text-sm sm:text-base"
            >
              + Add Content
            </button>
          </div>
        </div>

        {/* Form Modal */}
        <Modal
          isOpen={isFormOpen}
          onClose={handleCancel}
          title={editingContent ? 'Edit Content' : 'Create New Content'}
          maxWidth="2xl"
          footer={
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="content-form"
                disabled={createMutation.isPending || updateMutation.isPending || isUploading}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {(createMutation.isPending || updateMutation.isPending || isUploading) && (
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isUploading
                  ? 'Uploading...'
                  : createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : `${editingContent ? 'Update' : 'Create'} Content`}
              </button>
            </div>
          }
        >
          <form id="content-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                name="title"
                required
                defaultValue={editingContent?.title}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Play of the Week, Team Announcement"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                name="order"
                min="0"
                defaultValue={editingContent?.order || 0}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first in rotation</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content File</label>
              <div className="space-y-2">
                {(uploadedFilePath || editingContent?.filePath) && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    ✓ File: {uploadedFilePath || editingContent?.filePath}
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="hidden"
                  name="filePath"
                  value={uploadedFilePath || editingContent?.filePath || ''}
                />
                {isUploading && <div className="text-sm text-blue-600">Uploading...</div>}
              </div>
            </div>

            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                name="isActive"
                id="isActive"
                defaultChecked={editingContent?.isActive ?? true}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </form>
        </Modal>

        {/* Content Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={
                                header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                              }
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {typeof header.column.columnDef.header === 'function'
                                ? header.column.columnDef.header(header.getContext())
                                : header.column.columnDef.header}
                              {{
                                asc: ' ↑',
                                desc: ' ↓',
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm"
                        >
                          {typeof cell.column.columnDef.cell === 'function'
                            ? cell.column.columnDef.cell(cell.getContext())
                            : (cell.getValue() as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {table.getRowModel().rows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {filterText
                ? 'No content matches your filter.'
                : 'No content yet. Click "Add Content" to create your first content item.'}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-700">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} •{' '}
                {content?.length || 0} total items
              </span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-2 sm:px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ««
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2 sm:px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2 sm:px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ›
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 sm:px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »»
              </button>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="px-2 sm:px-3 py-1 text-sm border rounded bg-white"
              >
                {[10, 20, 30, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
