import { StatusBar } from "expo-status-bar"
import { router } from "expo-router"
import { useContext, useEffect } from "react"
import { View, ActivityIndicator } from "react-native"
import { SafeAreaProvider, SafeAreaInsetsContext } from "react-native-safe-area-context"
import { useSession } from "../context/SessionContext"
import { COLORS } from "../constants"
import Login from "../components/Login"
import IntroSlides from "../components/IntroSlides"
import { sesion } from "../services"

export default function Index() {
    const insets = useContext(SafeAreaInsetsContext)
    const { token, isLoading, introOK, introMostrada } = useSession()

    useEffect(() => {
        // Si ya terminó de cargar y hay token, redirigir a Cartera
        if (!isLoading && token) {
            sesion.inicializarSesion()
            router.replace("/(tabs)/Cartera")
        }
    }, [isLoading, token])

    // Mostrar loading mientras verifica el token
    if (isLoading) {
        return (
            <SafeAreaProvider>
                <StatusBar style="light" />
                <View
                    className="flex-1 justify-center items-center"
                    style={{
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                        backgroundColor: COLORS.primary
                    }}
                >
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            </SafeAreaProvider>
        )
    }

    // Si no ha completado el onboarding, mostrar slides
    if (!introOK) {
        return (
            <SafeAreaProvider>
                <StatusBar style="light" />
                <View
                    className="flex-1"
                    style={{
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                        backgroundColor: COLORS.primary
                    }}
                >
                    <IntroSlides onFinish={introMostrada} />
                </View>
            </SafeAreaProvider>
        )
    }

    // Si no hay token pero ya completó onboarding, mostrar login
    return (
        <SafeAreaProvider>
            <StatusBar style="dark" />
            <View
                className="flex-1"
                style={{
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom
                }}
            >
                <Login />
            </View>
        </SafeAreaProvider>
    )
}
