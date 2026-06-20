import { ref, computed } from 'vue';
import type { IMember } from '~~/types';

export const useBatchMemberImport = () => {
    const RawData = ref<any[]>([]);
    
    const availableColumns = computed(() => {
        if (RawData.value.length === 0) return [];
        return Object.keys(RawData.value[0]);
    });
    
    const columnMapping = ref({
        NIM: '',
        fullName: '',
        email: '',
        class: '',
        semester: '',
        enteredYear: '',
    });
    
    const autoDetectMapping = () => {
        const cols = availableColumns.value;
        const findMatch = (keywords: string[]) => cols.find(c => keywords.some(k => c.toLowerCase().includes(k.toLowerCase())));
        
        columnMapping.value.NIM = findMatch(['nim', 'no induk']) || '';
        columnMapping.value.fullName = findMatch(['nama', 'name', 'lengkap']) || '';
        columnMapping.value.email = findMatch(['email', 'surel']) || '';
        columnMapping.value.class = findMatch(['kelas', 'class']) || '';
        columnMapping.value.semester = findMatch(['semester', 'smt']) || '';
        columnMapping.value.enteredYear = findMatch(['tahun', 'masuk', 'year', 'angkatan']) || '';
    };

    const processMapping = (): IMember[] => {
        if (!columnMapping.value.NIM) {
            throw new Error('NIM wajib dipetakan untuk Batch Edit!');
        }
        
        return RawData.value.map((row: any) => {
            const mappedObj: any = { NIM: parseInt(row[columnMapping.value.NIM]) || row[columnMapping.value.NIM] };
            if (columnMapping.value.fullName && row[columnMapping.value.fullName]) mappedObj.fullName = row[columnMapping.value.fullName];
            if (columnMapping.value.email && row[columnMapping.value.email]) mappedObj.email = row[columnMapping.value.email];
            if (columnMapping.value.class && row[columnMapping.value.class]) mappedObj.class = row[columnMapping.value.class];
            if (columnMapping.value.semester && row[columnMapping.value.semester]) mappedObj.semester = parseInt(row[columnMapping.value.semester]) || 1;
            if (columnMapping.value.enteredYear && row[columnMapping.value.enteredYear]) mappedObj.enteredYear = parseInt(row[columnMapping.value.enteredYear]);
            return mappedObj as IMember;
        });
    };

    const cancelMapping = () => {
        RawData.value = [];
    };

    return {
        RawData,
        availableColumns,
        columnMapping,
        autoDetectMapping,
        processMapping,
        cancelMapping
    };
};
