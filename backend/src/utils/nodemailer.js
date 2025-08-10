// seu-arquivo-de-email-service.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_LOGIN,
        pass: process.env.BREVO_PASSWORD,
    },
});

/**
 * Envia um e-mail com um código de redefinição de senha para o usuário.
 * @param {string} userEmail - O e-mail do destinatário.
 * @param {string} resetCode - O código de 6 dígitos para a redefinição.
 */
export async function sendPasswordResetCodeEmail(userEmail, resetCode) {
    const mailOptions = {
        from: `"Quero-Quero ChatBot" <${process.env.BREVO_EMAIL_FROM}>`,
        to: userEmail,
        subject: 'Seu Código de Redefinição de Senha',
        text: `Você solicitou a redefinição de sua senha. Use o seguinte código para continuar: ${resetCode}. Este código expira em 10 minutos. Se você não solicitou isso, por favor, ignore este e-mail.`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
                <h2 style="color: #0056b3;">Redefinição de Senha</h2>
                <p>Olá,</p>
                <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                <p>Use o código abaixo para criar uma nova senha:</p>
                <div style="background-color: #f2f2f2; border: 1px dashed #ccc; padding: 10px 20px; text-align: center; margin: 20px 0;">
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 0;">${resetCode}</p>
                </div>
                <p>Este código é válido por <strong>10 minutos</strong>.</p>
                <p>Se você não fez esta solicitação, pode ignorar este e-mail com segurança.</p>
                <br>
                <p>Atenciosamente,</p>
                <p>ChatBot Quero-Quero</p>
            </div>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail com código de redefinição enviado com sucesso!', info.response);
        return { success: true, message: 'E-mail enviado!' };
    } catch (error) {
        console.error('Erro ao enviar e-mail de redefinição:', error);
        return { success: false, message: 'Falha ao enviar e-mail.' };
    }
}