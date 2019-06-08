import { Request, Response, Router } from 'express';
import { Usuario } from '../modelos/usuario';
import { SEED } from '../global/environment';
import jwd from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { guardarLog } from '../funciones/globales';

const loginRoutes = Router();

//===================================================================
// login de usuario
//===================================================================

loginRoutes.post('/', (req: Request, res: Response) => {
    const body = req.body;

    Usuario.findOne({ email: body.email }, (err:any, usuarioDB) => {
        if ( err ) {
            guardarLog(req.method, req.originalUrl, 'Sin ID', body.email, req.ip, 'Error en base de datos al loguear usuario');
            return res.status(500).json({
                ok: false,
                mensaje: 'Error en la base de datos al intentar loguearse',
                err: err
            });
        }

        if ( !usuarioDB ) {
            guardarLog(req.method, req.originalUrl, 'Sin ID', body.email, req.ip, 'Error en email');
            return res.status(404).json({
                ok: false,
                mensaje: 'Usuario o contraseña invalidos'
            });
        }

        if ( usuarioDB.status !== 'activo' ) {
            return res.status(401).json({
                ok: false,
                mensaje: 'Usuario desactivado'
            });
        }

        if( !bcrypt.compareSync(body.password, usuarioDB.password) ) {
            guardarLog(req.method, req.originalUrl, 'Sin ID', body.email, req.ip, 'Error en contraseña');
            return res.status(401).json({
                ok: false,
                mensaje: 'Usuario o contraseña invalidos'
            });
        }

        const token = jwd.sign( { usuario: usuarioDB }, SEED, { expiresIn: 14400 });

        usuarioDB.password = 'XD';
        
        guardarLog(req.method, req.originalUrl, usuarioDB._id, usuarioDB.email, req.ip, 'Logueo de usuario exitoso');

        res.status(200).json({
            ok: true,
            id: usuarioDB._id,
            token: token,
            usuario: usuarioDB
        });
    });
});

export default loginRoutes;