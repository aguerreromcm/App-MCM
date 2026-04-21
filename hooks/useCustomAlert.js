import { useRef, useCallback } from "react"

export const useCustomAlert = () => {
    const alertRef = useRef(null)

    const showSuccess = useCallback((title, message, buttons) => {
        alertRef.current?.showAlert("success", title, message, buttons)
    }, [])

    const showError = useCallback((title, message, buttons) => {
        alertRef.current?.showAlert("error", title, message, buttons)
    }, [])

    const showWarning = useCallback((title, message, buttons) => {
        alertRef.current?.showAlert("warning", title, message, buttons)
    }, [])

    const showInfo = useCallback((title, message, buttons) => {
        alertRef.current?.showAlert("info", title, message, buttons)
    }, [])

    const showSimple = useCallback((title, message, buttons) => {
        alertRef.current?.showAlert("simple", title, message, buttons)
    }, [])

    const showWait = useCallback((title, message) => {
        alertRef.current?.showWait(title, message)
    }, [])

    const hideWait = useCallback(() => {
        alertRef.current?.hideWait()
    }, [])

    const show = useCallback((type, title, message, buttons) => {
        alertRef.current?.showAlert(type, title, message, buttons)
    }, [])

    return {
        alertRef,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showSimple,
        showWait,
        hideWait,
        show
    }
}
