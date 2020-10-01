import htmlCleaner from "clean-html";

export const containerStyle = {
    position: 'absolute',
    top: '40px',
    padding: '1em',
};
export const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
};
export const getRequestTitle = (request) => {
    const parts = request.split('-')
    parts[0] = parts[0].toUpperCase();
    const title = toTitleCase(parts.join(' '));
    return title;
}
export const requestToEndpoint = (request) => {
    const parts = request.split('-')
    parts.shift();
    return parts.join('-');
}
export const requestToMethod = (request) => {
    return request.split('-', 1)[0];
}
export const isBlob = (response) => {
    return ['image/png'].includes(response.contentType);
}
export const cleanHtml = async (text) => {
    return new Promise((resolve, reject) => {
        const result = htmlCleaner.clean(text, resolve);
    });
}
