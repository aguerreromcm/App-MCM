import { Pressable, Text, Linking, Platform } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useCustomAlert } from "../hooks/useCustomAlert"
import CustomAlert from "./CustomAlert"

export default function ContactSupport() {
    const { alertRef, showInfo, showError } = useCustomAlert()
    const phoneNumber = "+5215641709620"

    const handleWhatsApp = () => {
        showInfo(
            "Contactar por WhatsApp",
            `¿Deseas enviar un mensaje de WhatsApp a Soporte Operativo?`,
            [
                {
                    text: "Cancelar",
                    onPress: () => {},
                    style: "cancel"
                },
                {
                    text: "Enviar mensaje",
                    onPress: () => openWhatsApp(),
                    style: "default"
                }
            ]
        )
    }

    const handlePhoneCall = () => {
        showInfo("Llamar a Soporte", `¿Deseas llamar a Soporte Operativo?`, [
            {
                text: "Cancelar",
                onPress: () => {},
                style: "cancel"
            },
            {
                text: "Llamar",
                onPress: () => makePhoneCall(),
                style: "default"
            }
        ])
    }

    const openWhatsApp = async () => {
        try {
            const message = "Hola, necesito ayuda con el acceso a mi cuenta."
            const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
                message
            )}`
            const webWhatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                message
            )}`

            // Intentar abrir WhatsApp nativo primero
            const canOpen = await Linking.canOpenURL(whatsappUrl)

            if (canOpen) {
                await Linking.openURL(whatsappUrl)
            } else {
                // Si no puede abrir la app, usar WhatsApp Web
                await Linking.openURL(webWhatsappUrl)
            }
        } catch (error) {
            showError(
                "Error al abrir WhatsApp",
                "No se pudo abrir WhatsApp. Verifica que tengas la aplicación instalada."
            )
        }
    }

    const makePhoneCall = async () => {
        try {
            // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
            const cleanPhoneNumber = phoneNumber.replace(/[^\d+]/g, "")
            const phoneUrl = `tel:${cleanPhoneNumber}`
            const canOpen = await Linking.canOpenURL(phoneUrl)

            if (canOpen) {
                await Linking.openURL(phoneUrl)
            } else {
                // Intentar con dialer en Android
                if (Platform.OS === "android") {
                    const dialerUrl = `tel:${cleanPhoneNumber}`
                    try {
                        await Linking.openURL(dialerUrl)
                    } catch (androidError) {
                        showError(
                            "Error al realizar llamada",
                            "No se encontró una aplicación de teléfono en este dispositivo."
                        )
                    }
                } else {
                    showError(
                        "Error al realizar llamada",
                        "La función de llamadas no está disponible en este dispositivo."
                    )
                }
            }
        } catch (error) {
            showError(
                "Error al realizar llamada",
                "Ocurrió un error al intentar realizar la llamada. Verifica que tengas una aplicación de teléfono instalada."
            )
        }
    }

    return (
        <>
            {/* Botón de WhatsApp */}
            <Pressable
                onPress={handleWhatsApp}
                className="items-center justify-center bg-green-500 rounded-full p-4 mx-2"
            >
                <Feather name="message-circle" size={15} color="white" />
            </Pressable>

            {/* Botón de Teléfono */}
            <Pressable
                onPress={handlePhoneCall}
                className="items-center justify-center bg-blue-500 rounded-full p-4 mx-2"
            >
                <Feather name="phone" size={15} color="white" />
            </Pressable>

            {/* Modal de alertas */}
            <CustomAlert ref={alertRef} />
        </>
    )
}
