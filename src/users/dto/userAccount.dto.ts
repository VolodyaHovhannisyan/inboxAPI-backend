export class UserAccountData {
  "data": {
    ["total"]: number;
    ["domain"]: string;
    ["accounts"]: Array<UserAccount>;
    ['box_limit']: number;
    ["pages"]: number;
    ["success"]: string;
    ["page"]: number;
    ["found"]: number;
    ['on_page']: number;
  };
}

export class UserAccount {
  ['aliases']: Array<string>;
  ['iname']: string;
  ['hintq']: string;
  ['fio']: string;
  ['maillist']: string;
  ['enabled']: string;
  ['sex']: null | string;
  ['birth_date']: null | string;
  ['ready']: string;
  ['fname']: string;
  ['login']: string;
  ['uid']: number;
}
