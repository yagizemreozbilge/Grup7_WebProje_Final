// Utility functions
export const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('tr-TR');
};

export const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('tr-TR');
};

export const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};