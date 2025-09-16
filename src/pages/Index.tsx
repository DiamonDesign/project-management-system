import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { 
  CheckCircle, 
  Smartphone, 
  Users, 
  BarChart3, 
  FileText, 
  Zap,
  Star,
  ArrowRight,
  PlayCircle,
  Shield,
  Clock,
  Target
} from "lucide-react";

const Index = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-blue-400 h-4 w-4"></div>
          <div className="rounded-full bg-blue-400 h-4 w-4"></div>
          <div className="rounded-full bg-blue-400 h-4 w-4"></div>
        </div>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">FreelanceFlow</span>
          </div>
          <Link to="/login">
            <Button variant="outline" className="hidden sm:inline-flex">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm font-medium">
          ✨ Perfecto para freelancers y agencias pequeñas
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Gestiona tus proyectos
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {' '}como un profesional
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
          La herramienta todo-en-uno que necesitas para organizar proyectos, gestionar clientes 
          y mantener todo bajo control. Diseñada especialmente para freelancers y equipos pequeños.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/login">
            <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              Comenzar gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="lg" className="px-8 py-4 text-lg">
            <PlayCircle className="mr-2 w-5 h-5" />
            Ver demo
          </Button>
        </div>
        
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            Sin tarjeta de crédito
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            Configuración en 2 minutos
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
            Soporte en español
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Todo lo que necesitas en una sola plataforma
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Desde la gestión de tareas hasta portales de cliente, FreelanceFlow tiene todas las herramientas 
            que necesitas para hacer crecer tu negocio.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Páginas estilo Notion
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Documentación rica, credenciales seguras, especificaciones técnicas y más. 
                Todo organizado y fácil de encontrar.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <Users className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Portal de clientes
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tus clientes pueden ver el progreso de sus proyectos en tiempo real. 
                Menos emails, más profesionalismo.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Smartphone className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                100% Móvil
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Gestiona tus proyectos desde cualquier lugar. Interfaz optimizada 
                para trabajar desde tu teléfono o tablet.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <BarChart3 className="w-6 h-6 text-orange-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Analytics y reportes
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Métricas de productividad, progreso de proyectos y análisis de rendimiento. 
                Toma decisiones basadas en datos.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Zap className="w-6 h-6 text-red-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Drag & Drop
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Tableros Kanban intuitivos para gestionar tareas. Arrastra, suelta 
                y organiza tu flujo de trabajo visualmente.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Shield className="w-6 h-6 text-indigo-600 group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Seguro y confiable
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Autenticación segura, almacenamiento de credenciales cifrado 
                y copias de seguridad automáticas.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Freelancers y agencias ya confían en FreelanceFlow
            </h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-0 bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Por fin una herramienta que entiende cómo trabajo como freelancer. 
                  Mis clientes están encantados con el portal."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-semibold">
                    M
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900 dark:text-white">María González</p>
                    <p className="text-sm text-gray-500">Diseñadora Web</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Desde que uso FreelanceFlow, mi productividad aumentó un 40%. 
                  Todo está organizado y es fácil de encontrar."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center text-white font-semibold">
                    C
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900 dark:text-white">Carlos Ruiz</p>
                    <p className="text-sm text-gray-500">Desarrollador Full Stack</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  "Perfecta para nuestra agencia. Los clientes pueden ver el progreso 
                  y nosotros mantenemos todo centralizado."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900 dark:text-white">Ana Torres</p>
                    <p className="text-sm text-gray-500">Creative Studio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Listo para organizar tu flujo de trabajo?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
            Únete a cientos de freelancers y agencias que ya han transformado 
            su forma de trabajar con FreelanceFlow.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link to="/login">
              <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Empezar ahora gratis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>Configuración en minutos</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>100% seguro</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
              <span>Soporte incluido</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">FreelanceFlow</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>© 2025 FreelanceFlow. Todos los derechos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
      
      <MadeWithDyad />
    </div>
  );
};

export default Index;