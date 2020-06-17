import jwt from 'jsonwebtoken'

export interface TokenBody {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

const decodeJwt = (token: string) => {
  try {
    const body = jwt.verify(token, process.env.JWT_SECRET || 'SHHHHHH') as TokenBody;
    return body;
  } catch (ex) {
    console.log(ex)
    return null;
  }
};


const generateHashForName = () => {
  try {

    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let hash = ''
    for (let i = 0; i <= 6; i++) {
      hash += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return `#${hash}`
  } catch (ex) {
    console.log(ex)
  }
}

export {
  decodeJwt,
  generateHashForName
}