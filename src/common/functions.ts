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

export {
  decodeJwt
}