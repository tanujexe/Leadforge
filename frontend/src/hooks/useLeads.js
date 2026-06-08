import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { leadService, searchService } from '../services/api';

// Hook to fetch paginated/filtered leads
export function useLeads(filters = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadService.getAll(filters),
    placeholderData: (prev) => prev
  });
}

// Hook to fetch single lead full dossier
export function useLead(id) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadService.getById(id),
    enabled: !!id
  });
}

// Hook to update status of a single lead
export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => leadService.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    }
  });
}

// Hook to append note to a single lead
export function useAddLeadNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => leadService.addNote(id, content),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    }
  });
}

// Hook to delete a single lead
export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => leadService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

// Hook to manually trigger website audit (supports cached or forced)
export function useManuallyAuditLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, force }) => leadService.manuallyAudit(id, force),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    }
  });
}

// Hook to manually generate AI pitches (cached)
export function useManuallyGenerateAI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => leadService.manuallyGenerateAI(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    }
  });
}

// Hook to manually regenerate AI pitches (forced)
export function useManuallyRegenerateAI() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => leadService.manuallyRegenerateAI(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    }
  });
}

// Hook to bulk update statuses
export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }) => leadService.bulkUpdateStatus(ids, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

// Hook to bulk add notes
export function useBulkAddNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, content }) => leadService.bulkAddNote(ids, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

// Hook to bulk delete leads
export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids) => leadService.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });
}

// Hook to fetch search history
export function useSearchHistory() {
  return useQuery({
    queryKey: ['searchHistory'],
    queryFn: () => searchService.getHistory(),
    refetchInterval: 15000
  });
}

// Hook to dispatch search
export function useStartSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ businessType, location, limit }) => searchService.create(businessType, location, limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    }
  });
}

// Hook to fetch environment server status
export function useAppConfig() {
  return useQuery({
    queryKey: ['appConfig'],
    queryFn: async () => {
      const response = await api.get('/config');
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: Infinity
  });
}

export function useLogCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, callOutcome, details, followUpDate }) => 
      leadService.logCall(id, callOutcome, details, followUpDate),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leadActivity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['managementAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['managementProductivity'] });
      queryClient.invalidateQueries({ queryKey: ['managementTimeline'] });
      queryClient.invalidateQueries({ queryKey: ['managementSchedule'] });
    }
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }) => leadService.assignLead(id, userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leadActivity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['managementTimeline'] });
    }
  });
}

export function useLeadActivity(id) {
  return useQuery({
    queryKey: ['leadActivity', id],
    queryFn: () => leadService.getActivity(id),
    enabled: !!id
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, logId, data }) => leadService.updateActivity(id, logId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leadActivity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['managementAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['managementProductivity'] });
      queryClient.invalidateQueries({ queryKey: ['managementTimeline'] });
      queryClient.invalidateQueries({ queryKey: ['managementSchedule'] });
    }
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, logId }) => leadService.deleteActivity(id, logId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leadActivity', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['managementAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['managementProductivity'] });
      queryClient.invalidateQueries({ queryKey: ['managementTimeline'] });
      queryClient.invalidateQueries({ queryKey: ['managementSchedule'] });
    }
  });
}

