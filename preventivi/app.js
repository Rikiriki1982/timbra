(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CATS={mat:"Materiali e prodotti",acc:"Accessori",man:"Manodopera"};
const CAT_CSV={materiali:"mat",materiale:"mat",prodotti:"mat",prodotto:"mat",mat:"mat",manodopera:"man",man:"man",lavoro:"man",accessori:"acc",accessorio:"acc",acc:"acc"};
let eur;try{eur=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",useGrouping:"always"});eur.format(1)}catch(e){eur=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"})}
const num=new Intl.NumberFormat("it-IT",{maximumFractionDigits:3});
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>{const x=parseFloat(String(v??"").replace(",","."));return isFinite(x)?x:0};
const r2=x=>Math.round((x+Number.EPSILON)*100)/100;
const today=()=>new Date().toISOString().slice(0,10);
const fmtDate=d=>{if(!d)return"";const[y,m,g]=d.split("-");return `${g}/${m}/${y}`};

/* ---------- storage ---------- */
const store=window.PREV_STORE;

const IMG={"tools": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAK8AAADDCAYAAAD0pEFUAABQhklEQVR42u29Z3ciWbI1vJHw3jshVyqVaTM9687//wv3mZk7XUZeAoT3RoBAvB/u3fGePGQCUkmq6m7OWlrVXYUgyYwTJ2LHjh22+Xw+xzcuvsV8PsfDwwPm8zlsNhtsNhu2t7fXeo+HhweMx2OMx2N5H7vdDo/HA4fDAZvNtvIaVr2Gr1Ovz2wNh0P0+33c3d1hPp/D6/UiEonA4XBYvu90OsXDwwMAyHtvbW0Z/n+znnfZn+NNbDbbSoOwMqTJZIK7uzuMRiNMJhPc399jPp+L4W5vb2Nrawt2u33pxnnqhtOvdzweo9PpYDAYYDAYYDqdYjAYYDKZIBwOw+/3r3w/9T5sjPYHN171IW1tbcmDpOdRvevDwwPu7+8xmUwwHo8xGo0wHA7lvx8eHrC1tQW32y3e1+l0vsiX1w3r/v4eg8EA/X4frVYL3W4X0+kUDocDw+EQo9EIsVgMwWBw4USx2+2w2Wx4eHjYGOwfzXhVgzB7eA8PD5hMJhiNRuLVeDzziJ5MJnh4eIDb7UYoFAIAOJ1OeDyeFzNg9dgfDAZot9toNpuo1+vodDoYj8cAAL/fj3a7jcFggFgshkAgAJ/PJyeCunmf42TYrBc2Xquj12zd3d2h3++j3W6j2+2i2Wyi2+2i3W6j1WphPB5jMpnA4XDA5/MhmUzi/v4eLpdLDPkx16Aajf5v9JB83f39PUajEVqtFur1Om5vb1GpVFCv19Hv9zGbzeDxeBCJRJBKpZDJZJBMJhGPxxEOh+FyuZbG11bXsVk/mOe1MtxOp4NGo4FKpYJKpYLb21u0Wi3UajU0Gg0xErfbjVgshr29PcxmM4RCISQSiZXGqxrHMm+ne0gabqfTQbPZRLFYxNXVFa6urlAqldBqtTCZTOB0OhGNRpHL5ZDNZvHmzRvc3d0BAFKplOW1MYxQ84LNemXjNbvx63iVwWCAZrMpBntzc4ObmxsUCgXc3t6iXC6jWq2i2+1iPp/D7/cjl8thOBzC5XIhlUphMpk8+VSwujZ63+l0iuFwiE6ng0qlgkKhgJOTE3z9+hX5fB6VSgWDwQDb29uIRCLY29vDmzdv0Ov1MBwOBVGJx+OWiexm/YCed1lG/fDwgOFwiHq9jnK5jOvra1xeXuLi4gKXl5e4urpCoVDAaDQy/F6328WnT59gt9uRTCbRbrcXXvPU0MUqDh8Oh2i322g0GrLBTk9PUSgUDK+tVquoVquo1WoSp89mM9zf3+P+/h7xeNwAp9lsNknknuuaN+uJnle/4ctufrfbRavVQrFYxM3NDc7OznB2doaTkxNcXV2hUqks/bxqtYpOpyMIxEus+XyO6XSKyWSCXq+HTqcjRlyr1Sx/7/r6GtPpVOC9fr+PTqeDvb09pFIphEIhQSPMDHdjvK9ovOrRtypum81m6Ha7qNfrqFQq4m1PT09xfn6Oy8tLVKvVtQ1rNpt9k3Euu1b+22w2MxRa1jnui8UiptMpxuMxGo0G6vU66vU63r59i729PSQSCVNsmnHwpnjxisa7jrcYj8cYDAZoNBool8u4ubkR4726ukI+n1/q0dTl9XrhdrvXqq49demwFqE5t9uNYDCIer2+9PcrlQomk4kYb7vdxnA4lPeJxWKmocr9/T3sdvsmgXvNmHeZAU+nU/T7fcnYC4UCrq6ucH19LfFto9FYO4Hx+Xzwer1wuVxrl5ifsra3t2Gz2eBwOOByueDxeBAIBBCJRNa63larJT9M4AKBAILBIAKBwAI+zfL5Zn0H47XyFIwbq9WqGO7V1RXOz89xc3ODarW6kHgxU59Op4a/DwQC8Hq9cDqdpgnPS3jgra0tMWCv1ytG3O12F4x9e3t7AQGpVCqYzWbwer2IRqNIJBIIh8NIp9ML18/vpP79Jg5+YeOdTqeWlS5yAsrlMvL5PM7OznBxcYHr62uUSiXc398vGC4Tm9lshsFgIK9xOp3Y2tp6NaiJJBp+JjeVGrPabDZEo1H4fD7YbDa02210Oh3D+9TrdZycnCCdTiOZTMr3i8fjEqLw/ull5I3xvpDx0oi2t7dNjYlYaaPREGTh9PQUNzc3uL29NUULGBZ4PB4Mh0PMZjPMZjPhP0wmEykXv+ZSy9gsDdtsNoTDYcTjcTFEn88npCJ1XV1dIZPJIBqNwuPxYDabYTKZIB6Pw+12W8bbesK4Wc/oeZdVr5ikESO9urrCzc0NSqWSqfGFQiF5uFtbW4KVMtmZTCaYTqfy89IGTOYak6m7uzvc3d1hMBjId/f5fEin09jZ2YHD4UA0GgUAfPr0aQFtub6+NpSNef2JRMK0lKzSNDfrG4zXCs+1YoqNRiO0221Uq1Xk83nk83lcXV2Zelyfz4dQKIRQKAS32w2PxyM4q/qQSY0khPWSoYMZ842eV32Nz+dDLBbD7u4ufD4fut0ubDYbxuMxzs/PF2A0n88Hh8MhoYjD4YDf77fkQUyn0w0C8VyeV7+JOsGacW673UatVpMyb6FQQKVSMRiuzWZDKpVCMplEOByG1+uF3W7Hw8ODMMz0B8as/KVj3vl8jq2tLUEd5vO5HPVqguXz+RCNRpHNZhGJRDAcDrG9vY3RaITRaIRisWi49mKxCLfbDZfLhWAwiFgshkwmg3A4/Gyc5I3xPqKaxgRmPp8LmUVHF4rFohy3XHt7ezg8PEQmkxH4aDweo9vtYjweSyz92g9RLRZwU/I61M1nt9vhdrsRCAQQjUaRTCaleDIYDITn0Gq15Hd6vR6KxSK8Xi/i8TiSySR2d3eRSCQWkl7mE5v1TGHDsjhsMpkIsnB9fY3z83Mx3nK5bHhtNpvF27dv8dNPPyGXy8Hr9WI2mwmG2mg0hJhuBl+99DL7DCaN+sZ1uVzw+/0Ih8PY2trCdDoVWmev18NoNDIkcLVaDYFAAMViEblcDrVaDfF4fIGFpnahbBCIJxqvbrhqqVS9gaPRCI1GA4VCQUq/Z2dnyOfzBsw2GAzi7du3+Nvf/oa//e1vyOVy2N7eRr/fh81mQ7PZNBy9qkHRG78m2qB+V/V70DPTuDweD1wuFx4eHnB3d4dut4tut4u7uztcXV0ZYMFqtYpSqYRKpYJyuYxIJCLxPquHTBatjHQTBz/C864iUZO4fXt7i4uLC5ydneHq6gqNRsPwulwuJ173t99+QzqdBgCUy2W02204HA5BGdQHrsbXP8JxqsbfPOIDgYAUWHq9Hvr9vhB1rq+v5XfZUlSpVFAqlRCLxSR+drlccLlchpBswz57hph3Op1aHtuTyQTtdhvlchnFYhH5fH4hXCBx+82bNzg+PsabN2+kI2IymcDr9crD1wsYrxk2WJ086qZRuy3okR0OByKRCGw2m2DCk8lEYuBmswm1hFyv11Gr1VCr1RAMBmG32xEOh1+0R+8vabzEVq0SqNlsJjyGcrmMcrm8ELMmEglkMhlks1ns7OwYWnnYk8ZNopeHf4RlBqHxeufzOZxOJ4LBIFwulyAUw+EQzWYTjUYDvV5PNmWn0xEDrtfrgri43W643e5NWPCaZHQe9WxU1Ov/brdbMuxkMrnArqJXXVUCfm3PiyU0T2LPk8kENptNqmU+nw+5XA4PDw/o9Xool8soFAoolUpSPiZtkp43Go0iGAzC6/XC5/NZet5N2LDCwZglLKs4rePxWMjbKjzEFYvFkEgkEIvFEAqF4PF4FoxhOp2u5LO+dmlYT9rMNCZYwlZjVJfLhd3dXelvSyQSCAQCht/vdDrSr1er1YQ+yc3w1BanjfEu0TIwu3Hj8VjKpzqma7PZBA6Kx+MS30ErJ/P4/ZE87DLeAcMb8i3017jdbqRSKaTTacRisYVihNpqxO7pu7s72cSb9QzGS1Deaoez7k9MU491Y7EYkskkEokEEokEgsGg4UEPh0MMBgPc3d2JZ/3RjFe/poeHByEOMXwwOxXC4bAQeCKRiEFdZzweiwE3m00Mh0PpgdusZ/S8pASaGS9FQ4jN6g+RFSh6XgL6qvGPRiORdXqq11GhK6sfs9dZvcey6+BrmMiqbUPQuBuBQAB+v1/I6HpDarfblYrceDzeGO+3GK/ZQ12mesObzwegLofDgWAwKIIc5DIsMwYAC1iuymBjJr/sPRiC6D86PqsXPVhJYwv8Y5ojzf6dHIhAICA/6nfr9/tSkSMu/CMiLX9YtEGt+NBw+AB440nE7vV60PvOotEoQqGQhA5WDYh8XzMjoLHSqPQHrP6/ihGz7VzdGOrfqyEB35tt6wwL+HvqhubJwetdlmg6nU54vV7xwB6PB/1+38CD4L17ivFukjXFeHVPoz4c1u/5gFutFhqNhojQ6W09gUBAYr5wOGwq00TjVT2gVRXN6kHZ7XYxcP6u3i6kd0EsK0iYvUYPh1QRvWUxOsvHbCNSjZdhE0X7xuPxxvO+BM7rcDgku6Y2QbPZNIDwerLm9/sRCASEs2uFma7i6apx9/b2tikOSqMlP1atyOnvbWZs29vbcDgccDgc0ivHv7MiyKgnxcPDw8Kmm81m2NragtPpRCgUgt/vh9/vR7PZlM1GNczxeGzgLG8Qh2dCG1Qjms1mBly32Wwaavmqsfv9fgkbdJxzGU/XLOam0ZITa7n77HbY7XaDgao9acu8JI94t9ttMGCrcEY1ajO0gWVlEm9YiFBxbjLoSHj/Vm2KTcJm4QHJPRgMBmK4jUYDjUYD7XbbcOR5PB74fD45Lq08rxoyTKdTacExq8CRhqgXOZ5z0dBIkmHVTw87VGO22hA2m00kWXkKBYNBw8lBoRKSkXgSbdYze14aG1t9ms2mAO16ccLhcMDr9cpDW+YtmSxZGQMN2uFwLHTx4oV62PhDT27ledmqYxWKOJ1OuQeMedV7QayYYQN/VimtbxI3C8+LFXV9NiUydOj3+wtIA9lR9GD4RnaXCnW9hmfSobSnGgfvAY2W+hNmfXJENzZJ2wt6XiopjkYj9Pt9AdjNjNfpdC4dPGLGj9UNhVAaj1j9s/DMiuhMSnmM6xU0M0TGinfBpI+Ig8vlkkZMPXRil/T34HD8ZYyXRxthnru7u4WjTj1ylxmvSv6hkeoPjwbE2FAX91CNipU+1XsxLKFxLCMYEXMdDoeyQVn9s4LNltFFSaB3OByitcb7ol43v/cmYftGnHeVkiKNTPVMVpn4qgxfPZb50PTPp5YDW2yazSZarRYikYjEiszYycrSBflYqCByQERCxa85zKXb7aLT6Rg2pmpQjMHV72VlcDRUfh7jdp3cvuzk2awX4PM+tzQ9vbUVi4uq6uVyGV6vV9hohJnoJWk0ZkezqpvA/1Y3I0MhJqMMiVRvSxhNf/9lIZFa7NHvl2r464wg2KwnGi+PQXoRehIrCEz3WusQzOmZ+Htsu+n1eqjVasjn8wCAZrMpvFqy2hguOJ3OtT2velyzaEBNYXpgNc5WFc7VsOcxhCHd2NWGzh+RVfen8bxbW1twuVwSz9JQ1AfIBEsv/S7T+mWmrce91HSoVCrSoDgYDITowoqf2dRJq5kUNJbt7W0DxZHQ1WAwEMl+dYSV2WCUZdwGvlbnTejXs857bdYzeV4iCS6XSxAFVVVGZWctM141U1fJMLon63Q6Qsu8v79HtVpFIBCQTUNVSZXjoBuvSnZXORDcMGrixIlFxWJxYeSAen2qEVuFDeqcivv7+wU4jJuJydxGcOSJxrtq17PSpYovs5yqG+86FSM+ONXzmb3+/v4elUpFEio2O1Jth4nbOt0YHAerVg11UZHpdCqaa2ZwGuNYtZhh9jlMJknaJ2dX/TyeXlYx/2Y9wvOuQhvUkmcwGITP54Pb7TawpXhM6gIiy7Rw+eCWPbxer4fBYCCYKY2PuOy6D57fkWGDit1y5KzOT9Y3MDexlZ4Er4vGy01mhonTcK1wcTUsM0uSN6HGGmEDiSZUePT7/UK8UWc20OPwwVmhEmoljrwCv98vrUFWR7FZv9xrLW5WkoSsRg0wmVTH0g4GA4Pxqt9fJQJtlHKeOWxQWVIUmWNzodfrhd7bRgPkQzObkM5p7sFgEOFwGLFYDL1eD/P5XMa4WvWIMdZ8zooUYTQmgnoI43Q6EY/HZWA2ZZqwpGLHe8DihxpeqagNPflLczf+kp6XsaLX60UkEsH9/T2i0SgikQgCgYDINakDVdgi1O12TY2X1ElKftLbcjA1mxJJ1J7NZguQ0rcYr/oeqnz/9va2hD0sfHBk687ODnZ2dkSqycp4GcsTxiN1VPe89N783I13fSbPqzYkknDt8/kk1qQXCofD8Pl8aLfbUAcHkjbZarWQzWZNPW8wGEQqlZJWoFAohFarhV6vJ9itKuuvFht0432sQesxMg3Y4XAIbMbv73A4pKVpZ2cH6XQakUjEkqKp8kAYq+uldIZL/PM1Bsb8pRI2QkgqOO9wODCfz9HtdhGLxRCNRsVbQmkwpPFSVC4SiRiy862tLQSDQXlPj8eDVCol41BZNTOT9F9nMPZTwgZdn5ebiugKW9ojkYiousNCSYgFD7VLWO3E8Hq9QoCn933MBKbNPOM1PC/BdvXmBoNBRCIR6VHTuyXIEeD0y0gkgtlsJiR1YsVOpxM+n0/UEikPSm9LaIqoBQ3ruY2XyINKiFdPHopKqxDhMnmm+/t78bbtdlskAqAQ39kSz3FdG5jshVQizbyCOiBPPz4fHh7QbDalUhWPx4XP6vV6F7oRVPRCHaKiFhBU7/8cMe86A2P0ihyNWw0xrIxXjXUZBuldGz6fD36/XzgTm/XCsv4qbESuqlnsx06LarWKZDKJSCSCaDRq+cC3t7clsVOrWFCaHF/aO60LSekdIDAh7rPfr9vtGnBwAIb2IBW33qwnJt9mYQNWdAowbvP7/fD5fNCLCo1GQ3reBoOBeNB14096O53EjRcU13vMpEwsmb3MOJekffW+qZ3VdAKriPubtYKMbhVLWj1UTrghVgsT1fRqtSqiclbFhz/aUrkQVmpC/NGZaZxlEYvFEI/HZQ7dKuL+hir5yE6KVRmty+WCz+eTLFw/+kgvbLfbaLVaC23yZrHiH6GPiwUMfe4wABnnxc5qNWTgqNpYLIZ0Om3Q510V824M9QltQCquuqxKFolEEIlEFoy30WjIbDaKlFgZBNEFKwG77+FhiS+r16NSQtWNR85xPp9HqVRCtVo1fF+v1yvGq6pI+ny+TcL23AmbmuFbGS89L4sWrVZLPNNoNEKtVkOpVEI6nUaxWJQp6PoxaaZS873HmapGq29ifYhivV5HsVjE6ekpvnz5gouLC+TzeUO86/F4EIlEkEwmkU6nEY/HEQqFZC7HZj2j0J5uOPr/cx4ZlSCr1arEuVAmoAcCAQH2CYvlcrkFA9a9z7qx90sPVVn1una7jevra5ycnOD333/HP//5T3z+/NlAWCJCQ6+bTCYlbHC73QbjXcUV3qwlxqsarmqw+s10uVxSrNjZ2ZHSLrNs4H+5DqVSySD5ydll4XAY0Wh0aULyveYxrGs8w+EQlUoFJycn+Ne//oV//etf+J//+Z8FwwUgoRXnc1ASS538qXI49E27MeYneN5lMp5+vx/JZFIQBUJDw+FQsvF+v49isQi/3y9t4DabDTs7O7Db7ZaSUD8SumAFjTWbTdzc3ODs7Ay///47/vOf/5gabjweRzweRyaTQSKRQDQaNSS5JMJv6I/PGPMu/aX/Y5qFw2Hs7OxgMBgIRMTysJqFE5B3u91iDOwkMGOeMVl6jQbFZeGB1b91Oh3k83nD9M9arbbwOq/Xi4ODA7x588YwbEVXFKJe8Ga9kPGqnoEc32g0KvoJLIuS1qgSx4vFonQMEOhn5Ww+ny9wJHSoziwOfS4vZTXtk1Pp1e89m83QbDZxdXWFz58/4+vXr7i+vl4YoAgAoVAIP//8M3755Rf88ssv+PjxI3Z3d01PG96HzXqmsMGKJqlm0KrIBjt6qWWmGu9sNkM+nze0e6vdF4lEAqFQyIA6vNQRqsfSupS/+tkk7ozHYwwGA7RaLQkV/v3vf+M///kPrq6uFoow8Xgcf/vb3/Dbb7+J4b57925hHt2me+IVPa8q8W+320W63m63i84Cf0ajkaELdzweo1AoyOYg91Xtsg0GgxJG0PM991A9q14wq/eezWaGCfdfv37F58+f8a9//QvX19cL85aTySR+++03/OMf/8Df//53fPz4EW/evDENj6xClI0XfkbdhlUq5vF4XLQWOp2OSP5PJhPDkMHhcIhisWgoTqi4Kjm0hNJ4nFrJjT6H511lLOwqLhQK+Pr1q6AKnz59WqgK2u12HBwc4OjoSLztOoa78bqvOL7VbCUSCbTbbUEeVF6uTlgvFouSyVMTgkNIgsGgAQf+3g9zMBig3W4jn8/j/PwcJycnOD09NS1nRyIRBINBmfzp8/nWTjY5Z2NZZXOzvtF4rbyD0+lEIpEQrFeVVLLZbAYP3O/3USgURImHWDBhJas2m5fGfnUPPB6P0Wq1UKvVUK/XUSgUUCgULIlG7IzgzLVGoyHVSIfDISfM1taWcHtV495U276T56XnYf+ZzsDSPfBwOMTt7a1wJDKZjCAVekauow1Ws+OeGjaYFQPu7u5kUnulUkGpVBItM6woXtTrdVxeXmI0GqFUKkkljToVPp8PkUhEOpLXaQX63sWbP6zxrpv9OxwOJJNJwWipIMNp6WxOhELgKZfLiMViKJfL2N3dNfVqqrYZZfWfG9NVNcxUw6XRNptN0/FdOueh3W7j6uoKg8EAhUJBijNUGWLrUzablVMpFAqZhhd6/94mkXui5113p9vtduzs7EjliLJHrL7pqjStVgutVktohGbav8uu5VuTHJ10Q8Wbbrcr10ZaJ7uZrYyX8OBkMkG1WhWPyx/yn9PpNAaDgeG9/H7/AufDavr8xus+0vNajVYlSqC/PpvN4v7+Xnq5yO1ldwUU8rraNWxmHPRKfLjPjQObSaOOx2PhIasDrlWtCh1SYxNpt9s1tOmTpUcKKcVV1BG0ZJq53W4DzrxZL+R5lw2eJoSWTCaFSUWxEl22icgEs22s0Fx4ac+jchpms5nQQ5f106ndzlaLQxiposOGU25eFmzUMvpmPYPxWlXdKOBstjweD7xer7S5cxbvsgLIKqVws+t4aphjlbypncJMplRxvG8Z8NLtdg0DXFiZpEHbbDakUqmVE5U2SdwaxmvFb1VDhmXURiosss3b7KGoauOrtNNWGa/ewv4Y6E/tDiYGzWumptgqj8jZwyx139/fG4RHGCrl83mDKN/d3R0eHh4kuUsmk1g200NVad943m/I3K0Mhd6FLDEagNvtNhyxNJJ1COBmHue523/MKKGMXVctFigoKMJYmFOH6LWn0ymKxaKMKJhMJoJ788dq8Li+Qf+qSZx93VjX7OaoXgAWreBqoULVudW1anlMr3tU6p7nKQ9PN1A1TFAH/Kk6u2bNl1ypVArpdNqA31J1vdVqodFooFarGfDuWq0myaoqakLoLhgMGu7LpuftGTzvKg0D3bhpGPpAFhquqtnwmM98jNGuMzaK8zYYi6pja9vttmm8a7fbkclksLu7i2w2K20+TqdTRKtJ7vF4PNje3jYQenq9Hk5PTw3DZXhysdv4W6eK/umNV49vnwOSUucv6PMh9KNwlfbut2Tg+lSeZSR3wmStVgulUgnFYhHFYnGBcM4Cw87ODg4PD7G7u4udnR3pDKb3JEEpFovJXI37+3t0u11DiPX161e5TnKkiS1T52GdMG5V3P9Hi5MtG4GXeSczDBePHI2qDzYxiyX5GqosLuvofcr1qN+HMTgnvMNCLK/ZbKJUKuH29hb5fB63t7cLGysWi2F/fx8fP37E27dvcXh4iFQqBb/fb/CUk8kEvV4P5XJZFIZmsxnOz88NFcXpdIrPnz8beCEMuci4069Zb89flgusi9T8aEZrqbJv5XX5oJaxnDhFEoBBmonTeijzORgMBArS57RxEAvVxDudDhqNhhC3SXIhqE9CyzpGrCeV6ne08vDtdhu1Wg3FYhHlchn5fB7FYnGhMOHxeJDNZvHu3Tv8/PPP+Omnn3B4eIhkMimhB3FrDkSMxWLweDyGgeAXFxcLY7O+fv0q8baqVul2uxcUitTT6i8HlZlBTfqEHYqB8KET/uG8hdlsJtDQ1taW/Hur1UK5XMbt7a0ws9SMm+/N11arVRSLRbjdbnQ6HbhcLoxGIwwGA8FA3W634MWEsKx0zfSEzmqcKpTetNvbW9zc3OD6+hpXV1colUqmginpdBp7e3s4PDzEu3fv8P79exwcHFjGpolEAoFAQIyZGPl8PsfFxYUhEZzP5zg/PxfDpcgL77GKQvA164QGf7ahLHY9W6cB8OGqA6zJURiNRuh0OqJFSw/B9yA/gF60VCqJkgyZY7q3q1aruLy8hMvlQq/XE10DNdN/eHgQXVu/3w+/3y88YP49hw6aPSAro6U0683NjYiHnJ6eivHqK5PJYG9vD/v7+zg6OsLe3h6y2ezKpCoWi4nsP4Wzed9OTk4WxrqenZ2JQg95EkRBdN7zXzJhU8MDsxhwNBqh0WgIzNNsNqXVp91uC8yjVsfIBaDoHrN1srNgQiMsl8twOp0C4HPmms1mkyErwP9q3Hq9XiG5hEIhpFIppFIpJJPJpcrlsCCbk6t7fn6Oz58/49OnTzg5OcHNzc3CgJWdnR0cHx/j/fv3ODo6wv7+vnjVdVYoFEI2mzXgyewYOTk5MYQz8/kcp6en4n1JdppOpwLJmRmwnphabWb8gQUPDZ7X7JiZzWbycCljVCwWpUavj5+iN+Fwv+l0KkwyvtYqSahWq7i/v0ej0RAPqs5MIzeYyursWEilUtjb25P3ns/niEQiC90YZg/t7u5OPD4N9/Pnz+J1VcPd2toST8sE7ejoCNls9lH6E2rxgV0kqoD1ly9fDAZ8f38vBkwIT01eY7GYaRLHZI+hhpr0/BG7NcySzaXGOx6P0W63USwWcXZ2htPTU9zc3KBUKgnmyUF+pBMyU+YNs5IENbs4cmZ5tPNPVqpYqWPzJyf1cBSWenpwTvGy8ajNZhP5fB5fvnzB58+f8fvvv+Pk5ET67KDwlHO5HD58+ICPHz/i/fv3ODw8RDabXdr5YZUpk/5ILQvOZePm00OIu7s7nJ+fG95P/W7RaNQ01uf31vFthis/OvlHtxsdSbEvA++HwyHa7bZ0zp6enuLy8hKVSmXpiNZvWfqcXiyRz280GiJeTV0ItX2eWKuZl2k2m7IpT05ORIfh9vZ24bXZbBZv3rzB+/fv8e7dO7x9+xa7u7tCYzQzApVxpxsdr5MjD+h1Vb6w3lLf6XRweXkpXlNPPMPhsFwHE1PVgNWk+0cdn2UGHiwTJrerpBhovIRer4d6vS4dBbe3t6YP12wsquo51ZGn6ghUlT/LjgsmZmplTpVE0sMa6kEQeVAfKsVRzFCFq6srfP36VVrZT09PTb9bJpORcOHg4AAHBwfI5XJIp9NL41y1fK3Cj+qRvbW1JZDgfD6XXIGe8ezszIBCtFotQSH4PqocK7UvzAo6y6ZsqvfVyhsvGx+2rgfXX2/2njollacp2Yvq79h1lIHejwlZvV7H7e0tyuWyqaQRkxA2GfLmq/CVakw86tSYlNRAclpV0Tm+jgiHPucBAPL5/ALnlkqWusE3Gg1cXV3h06dP+Oc//4n/+Z//wZcvX5DP52HGVXjz5g3evXuHo6MjQ6iwboKmi5hgSe/fcDgUD0n89vz83IAxt1otKSWrm5i/l0gk1vJwLILQGFQFI/5pNUZMP87Xlarie/BkVT2q/ndqMqtyOlSnZ+dDZ6xKD9BsNlGpVHB7e4tKpYJms2lqOJlMBplMBpFIRLoA1OmSnCSp7iIar3qkEl6j51UJKsSCuZEqlYrhhj08PODi4kJ+z+VyIRwOI5FIGF7X6XRwc3OD33//Hf/93/+N//f//h9OTk5M5ZqSySTevXuHjx8/4vj4GEdHR8jlckgkEgtzOL51cTJSKpVagNBsNps0c6rQ4tnZmSmNk/zpZWEZK5kqaUrlK7/k1KVVnpkGy81kBW/abLb/jXn5j2RQEZ+tVCryp9q6zrW7uyvHaSqVknFVenXOrHigs8L4EPggiG9Sjaff76NUKiEajSIQCKBYLBo6MubzOS4vL+FwOKRPbG9vD6PRCC6XC9PpFLVaDRcXF/j8+TP+/e9/49OnT5bKju/fv8dPP/2Ed+/e4fj4GDs7O0ilUiLV+tzL7XYjHo8bNjfvj91ux83NjaFzudVq4ezszGDonPOmjw1TTzji9UR/1PYmNaTTeSZq4cpMMuupUlt6pVDX8yDGzetTv5ehPMwvx5kSlUoFhUIBtVptocq0s7OD9+/f45dffsHx8TEymYzseNWLqzgmYzMzuiWPMrWOzziWG4rG6/P54HK5kM/nDfRCAMJFODg4kMZJl8uF4XCIarUqiefZ2dmC4bL37vDwEB8+fMCHDx9wfHyM/f19JJNJhMNhywGC6j00U7qkR1sWH1KkhD+qwWxtbeHq6mrBgM/Pz4Vqqk4Y0kfnsreOJXuW7XnSEUv+3p6XBkwl0kAggHA4LDK56vgvu74zOYK1Wq2iXC7LXAk17goGg9jd3cXbt2/x97//HT///DPS6bTEp2ryoZNwVAPWucLkArCbgDuONz6RSMDr9Uo4QXaW6oH7/T7q9bqhOGK329Hv9+U7cXaEntCoVbO3b9/izZs32Nvbk7BomeGRy9HpdKQnbT6fG4jl1GJTj0EmIty0fr9fjFV9mPRMl5eXhvCt3W7j9PRU7hlPhclkgnA4LCcXr41JOOdEM3wgCqF+x2+Z8bxqaLlZkka9D35fCnJnMhmkUilEIhHM53NxknadIMOhz81mU3gJesgQCAQMyczPP/+8gHVSfET1JLrx6sbASp3ZcL1IJCIPhuENeQ/EQFWPVK1WZSKRzWZDt9tFtVoVHQYdjmMI9PbtW+zv70tyRkHoZdDScDhErVYzJLY8qbxeL6LRKPb29rCzswOn02m4V2a8BB77jH/V0Orh4QFfvnwxQJXtdhsnJydS5eT8Y94zFpt6vZ7oUTSbTeGajEYjSfh4PSx0PGcXs5nh8/Po8Eg3cDgcSCQSODo6wvHxsdQT2FLmcDj+f+OlF+MgPA4BNCvncpg040ozkF7vmFg37sMSUZBkMikhBMnhLFur3FhuQD4oqvXUajW0Wq2F7uVMJoM3b97g6OhIEjN6W6v4US0g1Go1KS+fnp4in8/LfYtEIjg4OBAapl5QsFoejwexWGyBc/Lw8IDRaLSwYev1upSXuZlYQGGJvd/vL+QynU7HkLxZDZXBM1McVSiUnzcYDAzPJpPJiIwAQwhOXjUYL2NSchJIwjFTsGFFKBQKLVD0XnIR2A8GgwiFQtJK7/f7DcbLI4hGvLW1JQZPT6OWa3O5HHZ3d3F8fIyDgwOR4Gcv2jLDJQJyfX0tvIivX7+i2WzCZrMhk8ng/v4ekUgEu7u7j5o35/F4xNgZWtB4R6PRQiWwUqkIzFmpVBCNRmXGMRGbTqcj8lW1Wm1hI/9IizNNSIRijM57aF83TjHzqt+rvMgEiMZM7yiEjf9r5qQBb29vC0ZMXjEXx3HRgNXkjPEnLFrYG40GisWiQbf3P//5Dy4vLw2hUCKRQLfbNRRg1hEQZBlcDb3oIdnzVigUFnBsnjKcQOTz+eRkZT5DQ//RF7nck8nEMLNvIeZlTMGaO6mH6u5kyY49Xt1u1xJXVHkP67ahLxtios70JdTDeE0PMZitq7gmDVflE3M4TCQSQSKRQDKZRDabXRryUKaVhntxcYEvX77gy5cvBsOld2bZ1+w+6GVkM2iRKAQ3JIs6W1tbcDqdyOfzhoR6NpuJZ+UkIo/Hg9lsJqHUH8Fw6VyINKjsOoPx0ptRDI5HczgcNiicz+dz6e8icZvHq5odM6HihrBqUeHDYrWHSQO7JXihzJIJhRUKBZRKJXQ6HXQ6HcP7skxMzFIthuhEIZWkzkmVywx3Pp+jUqng+voal5eXOD09xcXFBc7OzhYMlyQcDhhfNuVdNV4auh5CxONxuX5WEcmPODs7WzBIYtvj8VjCH54AZqcp9YWZe9DDL0uyvyXmnc/nhq6Tu7s7EWVxOp3IZDJ49+4ddnd3kUqlEAwGDa1QdjU8YLsJGVupVArxeFx4vGo2XygUcHp6KqNbo9HoQnlR9bzLpEn5wFTj5UWywsZY7fLyUgyFHQ96UslTw+fzyXxfVmrMOByMIQnVYIVk0+3trRB6Tk5OcHV1hevr64VWIafTKR3F8Xh8obdt2YY2W16vF/F4XIoYbIliTKuXjdUQh8anCx0SPSJnI5lMGtqseFIRxnwO41WdB3FzolMMERwOB2KxGA4ODvD27VukUimEw2GBSheKFPQ+LK1mMhns7OwI9MOH0+12USgUEAgE4HA4MBgMkEwmRWhD9S4qhmvFHOINIQ9YNV62FZHddnl5iaurK5yfn+P29tYwdZNHbDgcRiQSQTgcFmpkr9czGDO9FKcYqWqVVkkoifIXFxe4vLzEycmJMNF0PQe32423b9/iw4cPODo6QjqdRigUMi1yPIbhFQgEREle/T4M48w6PwAYEh19gx0dHeGnn37C8fExdnd3BR9+eHgQdUx1HomO1z6VoUYhGhUGZI8jI4B4PC5wJaubC8ZLEozP5zMIZVQqFVQqFWnVUTNBGlar1RKWlTquSo3x1KrbMoVG/h3bXra2tkRxplKp4ObmBjc3NygWiwaEQRX3S6fTSCQS8qUZp7JtyOPxCA5Lsj0RA7bX7OzsLMS5HNVKNtrZ2Rny+fxCzO3z+cQgPnz4gMPDQ6TT6aUJ4LIWdp0XzMKHygNm8yqLJWb5h9ni/Xr79i1+/fVXHB0dGfBhKmVOJpOFKuFzGK/q6FQ8m3xnQmOEx9TPt6uMHpbkbDYbRqMRstmskHMI7vOCHx4eJFFot9uoVCoyGYhG63Q6Da/XKZP6F1fjKpUkwlFSLJpUq1XTuC2VSmF3d1d+2CrDyiFjT9V4p9MpKpUK8vm8aCqMx2PUajXhyI5GI1E7//z5M758+YKzszNcX18vGK7T6cTBwQE+fvwo5eW9vT2pDj6W06reMz0WDwaDcr003OFwiNPTU1N83sqTJxIJ6UjZ39+XUFDlTo/H4wVyP7/7txivPjZMlbNVnSCsGjB1ZtH29jYmkwlCoZBIF5H9rxtNuVyWihy9Jb2EbryP1QnQxepY0oRFc2M2m8Xe3h52d3ext7cnajNsq/f7/dKoqQP819fX4uVbrRYSiYRsRrLsbm5ucHFxgfPzc1xdXS0cwzabDblcDu/evZOO4v39fREi0eNdq/nOj+k5CwQCyGaz6Ha7uLu7w/39PbxeL25ubtDtdjEYDDAajSzLuszeGYYEg8GFZ8AS/feERy2NV2+h4cAPZsrq7GAzj8cbRD4vCx480tS5FMvwZP0Gc6ezHGz1+5yDnM1mkclkkMvlkEqlRPTO4XAgEAgIesLQgEfpbDZDoVDAw8ODlJFjsZjE3ff39yLXVCwWUSqVFu7D9vY2dnd38f79e3z48AHv3r3D4eEhcrmcqdqN6nWWNUmu49VCoRByuZw4ISbc6olpRmfld6fDWeblfqTOC9qJnd5DNwyVS7lM60AnROsY57esdSX+2UlMTJMG6vP55DTgKZJMJpFKpYSko6IONzc3EtuzMqWiHe12G51OxzTG3dnZwcHBAd6/f4/j42Nho0Wj0YUkTZcKWGaw6wgJOp1OJJNJKdyQBBQIBGRE1mAwMN38pKGSGnB/f79wvYTMmNSvGryIb2gBUolIalOCGUxnt9pZNEZ+uVXHPqtaL9XbhiXduE6n07DZ1JiZR18wGJTkZHd3F61WC5PJxBCGPDw8CGdCxYqpDGT23Vid29vbw9HRET58+IC3b98il8shHo8vxKlW92eVAawyFG5Uj8cjkJwqGMjhjlbC3qq8lJljIpzJyt5rjBZbpYRvJ8zC451sJrWzgZUpsy9ms9kQjUbhdrsNFS011jXLKHViM/9U5VDVdiHGvbqW2Ww2E4/Bih9nH49GIwHcA4EAkskkDg4OJD4kSN5sNhegLvbULSMRJRIJ7O3tiXLO3t4ejo+PLQ33W3SF9TFe/FHbqba3t+VziUA0m03UarUF8pJ+PTrX2gzOtJoL/RxijKvED83G29rVChi962g0EkNQp7jrD5PzxFKpFEKhkBg+d7DZNPNVxqs24JFJTzJKq9WSihrRAs48rlarUuqNxWKIRqNyfPK9EonEgoBJKBRCpVIRDvAy/V2eMMTBc7kc9vf38ebNG+zv7yOXy0m8bdVt8dTB4I95vYrTl0olpFIp4WXr30/vbjb7HDof1YiXwXpPGaW76vfNqnN2vZOBonBEECiKrBNafD4f0uk0dnZ2xNNQRI7sNL3FmsncqotiuVYVWe71eqjVatLFTE4qPQxBeIYI4XBYhriw6MDkjZvC7/dLYkMIjgNP9D48hiiBQACRSERiXJLXd3Z2BJpb1iakGu+6D9xqTvKy32eCypIv/9S7R9Sqpxpq6ce33hD5nB73m/R5CY2pfN56vS7so2q1ukBI5wNkjJdOpwVmUaVN1S9sFjer/6Z2stLAiHB0u10Ui0XpGrDZbELbpAcuFApCZg8Gg0K0UStmXq8Xh4eHwp8IhUKIx+OIxWIoFotoNBrodrsLc4BVGmgymUQul0M2m5WqVDweRzgcXuuBPOahPVVfl7wHv9+PUCgkc50bjcbCKadKqn7rIMnvIi6tkiM6nQ7q9TqKxSIKhQLK5bKhd8rlcknd+ZdffsFPP/2EXC4noLnaSKkbrx5XmRn29va2qEBub29LyMC6OzNoMszUdX19DZ/PJwWLg4ODBdUaDjok4YWc4HA4LN0Xav8Zww5KjBKxIJ6cSqVMifRqG7t6H54zO7fSrmXFVGUHkhegnqBq2/wy6Vcr8ernChses5n5ne06bDIYDNDpdFCr1YS0rLLKiKsmEgkRVv71118tp9c8x/L7/YjH48JcY1cAu5x1SK5Wq6FarUrVieGEDi+lUilJCmnEsVhMPC8Njrg3se9IJIJ0Oi29VVZhAimMqoLNcxkunYNKNlKPdF43yVZqiVWPe+k4zE5GdRTvcyus68ardpCrbfD8Hjq3YqENiEo5nU5HwgY9UfN6vYhEIpKwvKThQutY5uYikYalXZ2HoMqxmhmv+j2orOP3+xeaEtVBMGxFoQGvmhWh/u6rH6lqr5cytEbP5r+nOrregElkq9PpyAaz2+0GTor6HBdmUvANer2eeDczUJwPMB6P47XJyVSHZKx6e3triNd4FPI4XEa89ng8orhO9ERVnFR7rVQaIquOqx7OS4ycFTK2pmOwLLRQ1TYfE4frCeZzfwf11L+7uxONENI4vV6vdISQwrBARudD5wAQJm9m0BErT6zovPYidZNxaiAQMOg3sFCxTCFSvYnkOng8HoPypT7zjUasVh3XGSbzUp51XWMi7m6F9iwzznUx3acgIvo19no9keNqNpuiv8bqnsfjEZrCgvGqCoSMNaxiJLYCDYdD+P1+ywuykp1/SgCvFkym06lco3508wuy8mZVFiWcp45oXYf5ta6U6ffkBOjVUf75Iy51tEOpVML19bXkWSy6MFkm7XaBjK5WtRjb+Xw+00HXd3d3QoXUY97JZCIt1dwMq444lh7p2YkqkEBDuVXqplHxhbtSN17GR2azKtRWoOeI+fSj+LmP2G+Z5qlOW3pN430MkjAYDIRTcnt7K+MUSEdliMruYYZrBuMlRhoIBODz+RCNRpFIJNBoNAwPiLoA+Xxe5kgkk0kJNUhBpDGq4YXVDaQ+rQqV0XNSQZGST7e3tzIXrd1uL2wudhSrA1ceM9nzsYvknXW98Z99PUa7jNVcCjvm83kxXiIp1AhhMco0YaPeVSgUQiKRQDqdRjqdFnV0NZuv1Wo4Pz9HKBTCdDoVgYz7+3sJvvlAVR6oLpWvox16kYIFFJarqUrDEQO1Ws2A9arDVggP6SwpVTH8uWJSVTvWqgPitTN5tZvlW/vPXmKRj8IpoxwhRjkutoOl02n0ej3REWGD5kIbENVwyI9tNBoiWEfkYTAYoFQqCd2w1+shEolI3xO5CHqTnVmBQv07tbDBJkBW2Pglb29vZcJQpVJBrVYzHFGEsEiL5DWaPVwVnH+sgZn9zjIY6rWNWA9dXhsSW+fz2Pw6GAxE+Yg/5K4QeSCZinIHYrx8iOxhY3LEzgWWh/v9vnhOGg1HkwYCAbjdbjFI1asxIdKTBp3DqgLvbIlmFzIbJcvlsmwonSUVjUal+kVhtlUJmMqms2rt5knCLmO2q7B65fF41mJDbRZMGYHE5Pv9Pnq93oJ0F3krPNUlHKX75tHOOHM8HiOTyUiZmJ5OPaIp1Far1cTL6ZL8NGI1cVgnEyfURaNmG5BZRY1VuFQqJdzaeDwugtePoRqqQs0UK+HndjodgdKY/RJvttok31pC/bPHxoRmVQquGlqycMauYpU3Y1ezbiZVPp8P0+kU/X4fsVhMFFfMIK/xeCyjTqkfoDKU1Pd/TLarVqbYBmQFsNvtdiSTSezs7CCTySCdTiOZTIpIxbpAuQri80ZSXIUbmAInHJg9m80kQXwsjPZXX6qgtMpGNEOGzDgYdrUMqleeqAtA6GkZXktSz/dY7Nlip0Q0GkUwGFx6zXpMqOLB3OFEVQqFgnQMs4M6Ho+j1+vB4/Egk8mYVhr1Kt1mmT8HFn5WFXV0MpLd6sbq02x+VICbJ4XKDiPKsApbNqseEZpjuz3VgU5OTvD777/L9PdsNiv6DlaT6nlqsLNhs8zL5/yTtFOVCKT2TqqyYQusMj0c4HQeik4s43vqvfyvtVSyOBsFWVlaVVWy4soyKaDxcqD3+fm5GOpkMkEmk5FiDFbMlvurzwm2Ml61iEV4lAPTiVSpxSbVM9sp+64KvLGCxpYb9v+bEVxInPD7/YLVsuplVe/GipZmlUNLr0X0gwou+kbjtM5ms4lwOIxOp4NYLCaYIB45F0FVlmTCpn4uReGolbBZT0vY1N44Mz4KGw/MFDbtqrYYPRfrzOymYHeBGtO6XC7pptjZ2RGojMbLWFolYK8KPXSkgjpclHxXcUBSF2ezmejR2mw26SZm60skErHkXqyawkn+hi6Lqm4axsfLHtD3oET+UTyv/t9mfGIs66Sg9yXhhfBXvV5HuVyWBkX1jWKxGPb39/H27Vu8e/dOvC83AL2USsxZ9ZBVUjVpl+yaYGmY0qJ2u12UvSeTCcrlsuF0YA9bOp1+FAKg4r6qMqJZIqGOfdpgvHjy9B+dEK/P2LPqwlloAyJJgvguYTCV12u32xGPx3F0dIR//OMf+OWXX5DJZBAMBqW6RhqeytrSL8BsGgzjWJ/PJ6rg0+lU5JZisZiUYtnVzGNcLR2S80uxDStDNYPL1HiaVT4zyI3x2HP3rf2VkAazdn59/pulVJVq4ZPJRJKUWq0mwnZ6GxB1Yo+OjvDrr7/iv/7rv158NkUymRR6HJXR2aqkrna7jZubG+RyOfR6Pdzd3S1oR6ybSKinAPu/GN/qlbUNlvsdwg491iPLh1m2XlVTxzNRVO61hqrE43HRSGD51yyLV+N0tvR8a0bMkrUuQLcx2B/AePVZE+Trmo1t5ZhQMs9ec7GdPR6PSxUNFmyl4XBoqgmMR/BzrSqEVrHZZn0H41XVHRn7Euc1K8cyDnztTJpHOHvIVk1fX6VHsG5Mpg6oXiaWvVnfKWzQS3ZWLTyq6NoqeaTnXv1+X1qAKKxhhgJYDYBeJ4kyi491ETpi2aukQTfrFYxXVVdkg6PP5zMdU8WOCeKrr7VGo5F0lw6Hw4UeNChcB5aMyZJ7SYxys/B9FXPYBkR8lYNVIpHIwpCO0Wgk/WRXV1eiBctjmp2g9Mos/6karHoXhVrKVRVziEFz8DVZ9uxjY6cvNCkqDs8z62HDE/qwnmv+7ma9gPHSyCi+QaXBZDIps2qhzdu9urqS0UrpdFpa5TlHVu1h06eJ6wbFWJuK6qxz03iHw6FwDAqFgsz3HQ6HhrhT7aQgI+4xcbledNh42D+I8eo9bKlUCul0WuAyloc52zafz8Pn82E0GiGZTBq0AdhxoFIPV+lrqTEkvS6xVfbNsYeNf3Y6HUmkKG9KNCIWi0mJ+alFAzMS/Wb9QMZLY9LnsO3s7Eh5mDq9fKCVSkUEpXu9HmKxmJRyyY2l3hc3hp6dm00CYvhCDJXVNIYNlONXW5OIQnDTxeNxmdvFubub9Sc1XnWUFY9Jtr+k02lUq1UZzMFQYDAY4PLyEuPxGM1mE/F4fAG017ULdCG3ZSVbtTSrhg3UbWi1Wob3YuMoTwxKjq5qA9qsP7Dxkr+qyjepSVIikRCFcZfLZaD/3d3d4eLiAt1uF+Vy2dC5oA8RVGcLW3Eb1G4GdcYEubXkXJhREKkzxt41JmzL2oA26w9uvGpMR2MiMYZzuTigwyx5mc/n0qrMdnW1a1jVM9B5w8sU0tWyLFlqqh4ZLIT/IpEIQqGQdFRsSOB/gYRNNyZVWp9GuCzzHo1GBiFltS/JapCgme6BOlWRRZJV/XEUp1BHfhKp2Ky/gPHqVShW0DgZyExhEFrDpi7nqbbokAugel7dkBkqqPMg6IH1kEWH+GioPEXUbtPN+hMbL41NbQNSBSDIzjIzHo6W9/v9Bhklq4RtmfGadVPQ845GI7hcLnS73YXrUNuPOAyG0J7ZUDy8IDcVa5SaN+uZjFfVRyCrjP1rzWZTRjx1u90FHoPH45EB1YFAQERG1GqZyotVwwcraSR9eDK1H6gSyXFWJA6pxHSO3qrVakgkEqIqaFbifk6DXdVJ8RLeX8XK/6pcYjvxXR6z5PPW63UZ8UQ1RpVV5fF4cHh4iKOjI2SzWUSjUfGSJOzobTQ0TLaDm4UqfA27STnkkBuqXC5LDxs7d6fTKTqdjsS8Xq9XpFdfUktCbdYkz0L/9/F4LN//qUasdxywcYAz6szGTP3lKmwko3P2WqVSQblcRqlUWiDgpNNpHBwc4MOHDzg6OkIymRSJJLbLqwncKuVEtQ2ED9vr9cLpdBoqbBzJxP7+RqMhXpibi9OKOp2OqFXqhmUlBrLuQGtCf2zWnEwmMhyb/8ZQRm3x/hZ5AJ5sqvzRS50qf0jj5fGrDuyrVCoGL+nxeJBKpXB4eIhff/0V79+/FxEOinWwGVJVWLcKG2j0LC9TXNrtdsPlcslsuFKphFAoBK/XKx3FrVZL3rfdbssDTSaTaDabuLu7Exz7JY7up6pMPkXGX/fcf/V42tCASZl+zgZgKVYfquLz+WQO2/v37/H3v/99ISmid9CHWFvFvKqImhXMxemSaoezXoQg76Jer4tHfokuByaULpdLfvTGTW5aFTlhLP8tG4af+5iRCX96z0vJSWbsVm1AHo9Hpp0fHh6aZvNkhWFNLqw6Ocdq5XI5iW/L5TLC4bDpZzAe7vf7K5V+8IjWIF2elTg4BVfMjvnn9o4qhv6Y1vI/Y0K3ZTbGkwnX3d2daRtQIBAQpZxEIvGqF5xMJkW5Up0MAxMFnW9pAVqlv8DkkFVI/ICaCDqb709tvHrsZrbDeWSxFfy1Fz06Na3MuAt2u/2bjlOzMMOMl8HK3mvgyM8h6vFn4ydv6QgAHwqVFplB68J25Bu8dg8bp1ou0+t1u91i3Prk+W9tgbeauIM/kErNn854ecxQ2p/t7Xp37mQyQbfbFRz45ubm1S52Op2iUCigVCoZlMphIv7n8/kk8ftWb6MnXCqGy0k2+AHVaPTG0D9be75d96pOp1O6KTiUxOv1GoRHyuUybm5ucHJyIvJLmUxGhPY4X0ClWprFjzolUkUnqDZOb9dqtZDP53FxcYGzszMUCgUZjg0TeiTpkOtMqlwFhTGrZzEH+F+GXLfbRbVaxfX19YIuGkvU4/FYwpjnSN6IK5Oh53a7pRHAaiyCSku1in95Qr1UYmcGJ37r5xkaMGm4VFiMxWKIxWLw+XwG4+33+zg/P0cwGITD4cBgMMDOzo6QZzh4hJ0U6o1RY0e9ZDydTuX1Ho9HjPfh4UGE9mjAl5eXuL29XfB6+igrq2lAyzwWHzI5FKr4sarP2+l0cHV1hWQyifl8jlQqJRXBfr8vWDc3sEoPxSOLE+oGV4eB+/1+ZLNZRCIRJBKJBVUfVWBbn76kjqZVNY3VXIbPUC3erJq3oT5jPWFUnwU/T52N/Jj7Y1eJ4BxlFQqFZKoOW2r0ClupVILT6cR8Pken00EymYTL5RK4TS1b6lxdnVjDG8MHrUqV8oYPBgNUKhVpwmRXhRkWnEgkEI1GEQqFhGP8mB42lrDVm8nkTH1w9XodNzc3cDgcaLVaMkGeBCHeB4ZjT/Uy6v0jCjSZTGC32xGLxXB8fIw3b97A5XIZxguwxM4NaeZ51cZXVgWZ56hMwMlksgBnLjNedSyZ+rqHhwc4HA6pSvJPdQLquga8MMqKIh6RSERmsSUSCeTz+QXNsuvra8xmMzSbTSQSCfEsqkCHajjkOrCapvJ3zY481YtwDlyj0ZC2dzMYLZvNyiircDj8pE4KdVo8H57ZkPBGo4Hz83NMJhPUajVptSdUx++piieva6g6OkAuCNUwx+MxHA4HstksJpMJXC6X9O9B0VBWPe+q5PI1G02tlCEf5XnVRkmVQE7jTafT2N3dRblcxtnZ2cIbFAoFNBoNkSOlp+TDUo8PM9jG6mapCQcJQ9RpgIUI3+7uLvb29rC3t4dkMint70+ZHKkPQ6Hx6qEOdYHJt6DXpjd5bAu9mfFyMzOfUGfwNptNOBwOZDIZHB8fL0CGZpxqq6IHpQ/0e6HGp3qeYuV56bSsQjZ+lt7w8Jg42E7Pp14owXcqQZKGOJ1OcX19vWBw9AbfK6tOpVLY3d2V4/Pg4AA7OzuIRCILnnfVdB4d2OdRyaTLLG7s9XqmJwFeQUHo8vJS5kPrJ6NqGFb0TBqtz+eTdq91eclW93Ddjer3+zEYDERghj9WG8SSjK57CbfbLbPGqHHLsnA+nzeNN1970ePs7+/j6OgIx8fH2Nvbk3lsetigl0r13j1dQE+N+QiV/Wgg/3Q6FQkA/VRSZzxYnXJqpXCVaOFLOJ5QKIRWqyXQpi7eqN9zdY6F3QqysNvtCAaDyGQyBjGS3d1dnJ+f4/z8HBcXFysn4eAFZ6/RcN+8eYP379/j+PgYmUwGiURCuod1w9SpmeoDJTlInSpE6uGPzBHQh+vxO6tcakKQ+qnCcEgPGV5rsd/Q6XSKupFqvHo3umEakJXxbm9vw+12IxqNCgIRj8dxe3uLeDyOUCgEp9OJy8tLU6wVL6zRu7Ozg93dXRwdHeHo6Ajv37/H4eEh4vE4gsHggoe0Ejwxm3/MASqs5A2HQzHiH5EnEAgExGPpXsqso0UNFdUw6bXHkBF5UpWWrMI4y04KNXRQZeq3t7cFM2XRgtN1eAzZ7XYUi0W0Wi2Mx2OBhYiv8sJUkoyeOKjK44yt+HqiIHxP4pmcQkQDZpyrl7NXTUW3GhlLUn2/3xekg8NbzI5exosquUn1cOuWbvV5dmq4MpvNMBwODdews7ODbDaLWCy28N1JhlcbaFUD4UYlh7vRaLyqWDiRqlarJXkDmYBmp4p6usznc6PxqtQ/vftXnSq5tbUl4cL29jYikQharRYmk4lk5hw2QsiJInysvg0GA9zd3cnNZNLAip56pKlEnFAoJKNaOW+YcJ6V4aoeZRVxnNgyCw3d7v9OvjeD57a3t0UbLRqNwu/3i04bDUf37qsM2cz78MjnfWT10uFwIJfL4c2bN8hmswtdFUykeT1mYtgcUcvij9PpRDabhdfrFbya0Jwe91uRfVTcmFVOOibiuXd3d+j1emg2myiVSjK4h/K16gZUhc9VI7abHZ0q3KWvaDSK2WxmuIGZTAb9fl8+ZGtrCx6PR8Bx4pPkB9/e3srNVb0BddLS6TRCoZBwLAjDserm9XoRCoUQCAQQi8UQCoXWmu7O6fbLBqxww41GI3Q6HVHp0W8qu0kIzWWzWaFG0mDUKuOqUbJ6OKN7XtV42RXNqUzv3r3Dzs7OAjWTQxAZ/ujMOCIl9XodZ2dncDqd6Ha7iMfjQvpnQUQt3etOwazFihtXnWDJe8/Zdnd3d9LeRc6KLqdLrF0tpvDv7FYdsFYewmazwefzSSIXCoWkhm8Yavx/XtNms4m3qNVqArUNh8MFbJBA++7uriHx4oBC3gS1O8HtdsPtdlsahrpb1cbFZR6YU5HYDlWv1xfK0LFYDIeHh/j48SM+fvyIvb09xONx2Gw2DAYDCTd0431KI6YaytGgWEqPRCLI5XLY399HLBZb8Kp8NiwQOZ1Ow7E8HA5RqVSkV7BQKCAajYqHJXOQIaUZVGhmI6ywEYpTiU08BSgmw9Pt5ubGIKWrM/r0Urbdamj2shZ1KjISOuPO0BsoCeqPRiMMBgMUi0U4nU4x5O3tbcORTkKOWnBgqZfNmGqZlGEK++P0Rku9xs6TgGVoM+9LgcFGo4F6vY56vY5Go2HonA6FQkin0zLK67fffsPbt2+FmM/QqNVqGR7iOgy3ZUUblc3GmNrv94s+m5lojDpKl3mDaryccUf+CJ8r7xeNjKeVmfGaJcLq9zZj5KnxLEfz6l5XzUN479Rh7vZVN5JxkiqER+/LY3sd4gu7a/v9PorFIkKhEFwul9xIxja8ycFgELFYTNrqYcIcU2dDqDdV7VhWEzOVGGN1zZz6Sf1fM+YaQ5tcLoejoyOZAKqSg7xeL5LJpEGB8zlLqzw6rYoKNDg6EuYsJFmpm3E0GqFaraLb7QoX2gpOXMfzmgnP6ONZCQjw/RlCWA1qVNWTpGT+mBo0veRTpPKdTidSqRQSiQQikQi8Xi9cLpckQdPpVHrnOErr/v5+5cZ4TDfHqiJDo9GQ8bD5fF5ol+rD44Ylj2JnZ2fhuNbx8pcA99f53irFlWr3jMd7vd7CdCOGGTQqs0rausarUwDU4Tb8k0Zps9ks6wVut1uwYNWIt7e3rY2X7lmPib9F3CIYDArBnXMv1MVh3aVSSfBaog8v2XI0Ho/R6XRweXmJz58/4+TkBBcXF8JbUO9JIpFANpvF3t4eUqmU6amAH2QoNcd+RaNREWBhvLi9vS2JnFqZ43O3Ik2tqwCkMwkZdphpefBadYqBy+WSYhP52USetra2Fo1X/VCz5OJbK0xqKdLv9xsSiH6/j3K5LFL8KgHm4ODgRbR2O52O0CzPzs7EeK+vrxdK4ORQ7O3tIZ1OIxaL/bDi1eREh8NhpFIpAz2TlFOecMSBbTabGIZKUaXhMaf4FtEUlV2o5kbT6VRIR/x30nIjkYhMd2Ixxm63L/e8Zh74W+vwauWOwiDlchlql4YKoBNSubu7w97e3rN6ul6vh9vbW1xfX0uHxqdPn3BxcSFwnoou7O7u4vDwEHt7e8Kd+JH1fwk9EuelI2IT7WAwMBQ99MTouafXq/gwC1wqNMuw5f7+Hg6HA6lUCslkciHUZExu/xYFRJ2hpUs26b9HdCAQCEiVjDuNZHf2qVH8hOo7vV4PrVZLvN63yhw1Gg2USiVcXl7i9PQU5+fnODk5wfn5OW5vbw3eJRAISKiwt7eHXC6HeDwOv9+/Ml/ggzK7H8/Rir8shHO5XAgGg4ZqJeNFt9uNfr8vEgGqHrOuq/xSxquKmasY9ng8htPpRCKRQC6XkwIQw0c6DPtTb5wudaSrQ6oZK5OW6XQKp9OJWCyGXC4nRQreKBXjazabonijGm+9Xkcmk0EymZSBKWqXApMQHj36NVNIsFwuo1Ao4OzsDGdnZ7i4uMDFxQVKpZLBcB0OhyRn+/v7wlhLJBLw+/0yKIYxot49wiOZIP23DPFelbDq+QiTNTYHEG8m6YrlbrXbg5REfXrTc6pq0lZ0FSWS+ClnG4lEkMlkEIvFEAwGBeuXIT3PrUtrlY3ymPD7/chkMoabpeK3ajFgPB7j4uJCuALEXwuFgnRKsLqmIiC8Bm4uGhB3drfbxe3tLfL5vIQM1GTTHxRL0DTcXC6HTCYj3kBvi1Efilly+xzowzL4TQ3xmAjxlGKs6/P5DOKEqho9ZaReouNYLyubjQNmIYl8kVgsJi1d9LxPNl69lKx6XlauzLLN2WwmO57wB5M2chJIhlEz/NlshkKhIOOsGo0G4vE4EomEwFY0IiYbTAx4Q2i0DEHa7bZgucRzu93uwndlgnZwcIDDw0McHh4il8uJao+VZJVqtKuqeXii8Ir+DKzIRix389oImXH8reqV1Q2xbGYznkk/Qu3SUBswaSsulwt+v1/QBvIj1sZ51xVWtpIwZS2a6o/c3YFAQHbT1taWGO1wOMTFxYUBvrm/v0elUsF4PBZuBL0u561xFoVaQ+dnM6smc6nT6aBWq8l8OTMSdyaTEdLL0dGRkNx5hFl5FjOt3JdWkVz23kzOWK73+XwGko5ahbRCmPCKqvKsJ6hChap0gErftL/GzdSxPihtIBTPI+2Qsv3lctlAhBmNRmg0Gmi327Db7SIsompL6K3u9LzdblcMl6XbdrttCoyryeT+/j4ODg6QyWQMsdcyhMHM+30PAruajzBEWzUU5yWV3B9jvPqpreZFKiHI/tI30IqvCoWdxayyXq+j0+ng4eEBXq8X9XodvV5PMEqVZshSIr0JGWjqLDj+DudrqPOQzWAlalWkUinkcjnxtru7u0LA/yOJOasFh3XomKvGFLy2IZs5ARKSns14VzU1rirN+v1+JBIJHBwcYDwew+VyIRqNysDudrstiINufPf392i324YZbVaJAVa0FKXTaaTTaQOiQK4wxVd+tB42q5DkzyhpqvMh7C8Zc6lZ77Kdzw6JXC4HANL4SZGRcrksYwaKxeLKY+0xiUYkEsH+/r6hckbdh2g0img0KmXqVV0a38NgVn3mn8mI1Zzi2Yx3XYhkWbGDLCy3241kMolWq4Vms4lKpSLjBdgNfH19/c14qcPhQDqdxt7eHo6OjnB4eIjd3V0kk0kkk0nhYDAMWacMvBnQ/bqb1f49PAORAFWchJ2jPp8PiURCpv/U63URP6GQSDgcFrGTxxox+a9MygiD7e/vI51OGwZuEzsmRr3Ocb1Zr2fE9u+VBau4njoth5k8mz3D4bCBcE0i+O3tLRqNhgw4pBHTqFQVIL6v1+sVbDgej0t8S64CQ4RlXtYsJPnRjVgNs/SQa9k43e99vcvg2FfxvKs88rJEjvKd6iBvGu/+/r6gCKT6AZBSrao4ySZA9sMRYqO2F7s1AoHAygqYDuP8mY7hP9o12ebf4SnojYCrCOej0UiY9iSrd7tdaS6k2qAajugaYzRiYsGs7nFD6B0E63qyP1ro8EfcdJaAwPcw3qdwhMlvIL1PbS+fTCbCK9ABerUHii35/FG5FX+16ZF/ilNj/oNsRb26s44xMWYmV1XXd1UVEFXNrsdM0tmsjfE+SqvVSlITr6Tisqri9Gcz6h8xlFjnHtt/xBv4vQxXBcLNMvQ/i9H+EeLedULL/w+oy3i+qlXfLAAAAABJRU5ErkJggg=="};
const DEF_AZ={nome:"",note:"",ragione:"",capsoc:"",pec:"",piva:"",cf:"",sede:"",oper:"",tel:"",email:"",web:"",iban:"",colore:"#a4c2f4",formato:"n",pref:"",next:1,
  foot:"",cond:"",pag:"",iva:22,logo:""};
/* listino iniziale per una ditta nuova: solo una voce generica di manodopera (i prodotti li aggiunge ogni ditta) */
const DEF_CAT=[
  {id:uid(),cat:"man",codice:"",titolo:"",descr:"Manodopera",um:"h",prezzo:0,pers:1,img:IMG.tools}
];
const IS=p=>(p&&window.IMG_DATA&&window.IMG_DATA[p])||p;
let az=Object.assign({},DEF_AZ,window.PREV_AZ_DEFAULT||{},store.get("azienda",{}));
if(/\(esempio\)/.test(az.nome))az=Object.assign({},DEF_AZ);
let catalog=store.get("listino",null)||DEF_CAT.slice();
// listino fornitori (listino.js): aggiunge le voci che non sono ancora presenti.
// Facoltativo (Dati azienda → «Listino fornitori incluso»): già attivo per chi lo usava, spento per le ditte nuove.
if(az.forn!=="si"&&az.forn!=="no")az.forn=store.get("listinoFornVer","")?"si":"no";
function applyForn(){const F=window.LISTINO_FORNITORI||[];if(!F.length||az.forn!=="si")return;const ver=String(F.length)+"-"+(F[0]&&F[0].id);
  if(store.get("listinoFornVer","")===ver)return;const have=new Set(catalog.map(x=>x.id));
  F.forEach(x=>{if(!have.has(x.id))catalog.push(Object.assign({},x))});
  // voci senza foto: usa quella del fornitore con lo stesso codice
  const key=c=>String(c||"").toLowerCase().replace(/^ubiquiti\s+(unifi\s+)?/,"").replace(/\s+/g,"-");
  const byCode={};F.forEach(x=>byCode[key(x.codice)]=x);
  catalog.forEach(x=>{if(!x.img&&byCode[key(x.codice)])x.img=byCode[key(x.codice)].img});store.set("listinoFornVer",ver);store.set("listino",catalog)}
applyForn();
if(catalog.some(x=>x.codice==="CLM-12"))catalog=DEF_CAT.concat(catalog.filter(x=>!["CLM-12","TUB-14","MO-INST","MO-ORA","STF-50","POMPA"].includes(x.codice)));
const CONN_DEF={connFinale:"PREZZO FINALE A VOI RISERVATO",voipTitolo:"LISTINO VOIP (tariffa al minuto iva esclusa senza scatto alla risposta)",connNote:"I prezzi sopra indicati si intendono iva esclusa",connDurata:"Durata minima contrattuale 24 mesi"};
/* stato del preventivo: "scaduto" non si sceglie, si calcola (bozza o inviato oltre la validità) */
const STATI={bozza:"📝 Bozza",inviato:"📤 Inviato",accettato:"✅ Accettato",rifiutato:"❌ Rifiutato",scaduto:"⌛ Scaduto"};
function scadenzaOf(a){if(!a.data||!n(a.validita))return"";const d=new Date(a.data+"T12:00:00");d.setDate(d.getDate()+n(a.validita));return d.toISOString().slice(0,10)}
function statoOf(a){const s=STATI[a.stato]?a.stato:"bozza";if((s==="bozza"||s==="inviato")&&a.salvato!==false){const sc=scadenzaOf(a);if(sc&&sc<today())return"scaduto"}return s}
let archive=store.get("archivio",null);
let q=store.get("bozza",null);
if(!q)q=newQuote(false);
normalize(q);
// bozza non ancora salvata: data di oggi
if(!q.salvato)q.data=today();
if(!archive)archive=[];
function normalize(x){if(!x.tipo)x.tipo="lavoro";if(!STATI[x.stato])x.stato="bozza";if(!Array.isArray(x.conn))x.conn=[];if(!Array.isArray(x.voip))x.voip=[];Object.keys(CONN_DEF).forEach(k=>{if(x[k]==null)x[k]=CONN_DEF[k]});if(!x.layout)x.layout="lumia";if(x.titoloTab==null)x.titoloTab="";if(x.dataTab==null)x.dataTab=true;if(!x.totIva)x.totIva="piu";
  x.righe.forEach(r=>{if(r.pers==null)r.pers=1;if(r.codice==null)r.codice=""});return x}

function numOf(v){const m=String(v||"").replace(az.pref||"\u0000","").match(/\d+/);return m?parseInt(m[0],10):0}
function nextNum(){const used=(archive||[]).map(a=>numOf(a.numero));return Math.max(n(az.next)||1,...used.map(x=>x+1))}
function nextNumber(){const y=new Date().getFullYear(),k=nextNum();return `${az.pref?az.pref+" ":""}${az.formato==="anno"?String(k).padStart(3,"0")+"/"+y:k}`}
function blankRow(cat){return{id:uid(),cat:cat||"mat",codice:"",titolo:"",descr:"",um:cat==="man"?"h":"pz",qta:1,pers:1,prezzo:0,sconto:0,omaggio:false,img:cat==="man"?IMG.tools:"",link:""}}
function newQuote(sample){
  const base={id:uid(),numero:nextNumber(),data:today(),validita:30,rev:"",oggetto:"",
    cliente:{nome:"",piva:"",cf:"",legale:"",esecutiva:"",ref:"",tel:"",email:"",sdi:""},
    tipo:"lavoro",conn:[],voip:[],righe:[],sconto:0,scontoTipo:"%",iva:n(az.iva)||22,arr:"0",show:"all",showImg:true,showListino:true,layout:"lumia",titoloTab:"",dataTab:true,totIva:"piu",
    note:az.note||"",pag:az.pag||"",tempi:"",cond:az.cond||"",salvato:false};
  return base;
}
const lbl=x=>[x.codice,x.titolo].filter(Boolean).join(" - ")||String(x.descr||"").split("\n")[0]||"Voce";
function pick(c){return{cat:c.cat||"mat",titolo:c.titolo||"",descr:c.descr||"",um:c.um||"pz",prezzo:n(c.prezzo),pers:n(c.pers)||1,img:c.img||"",codice:c.codice||""}}

/* ---------- calcoli ---------- */
function calc(qq){
  const rows=qq.righe.map(r=>{const lordo=r2(n(r.prezzo)*n(r.qta)*(r.cat==="man"?(n(r.pers)||1):1));const netto=r.omaggio?0:r2(lordo*(1-Math.min(100,n(r.sconto))/100));return{r,lordo,netto}});
  const sub={mat:0,man:0,acc:0};rows.forEach(x=>sub[x.r.cat]=r2((sub[x.r.cat]||0)+x.netto));
  const listino=r2(rows.reduce((a,x)=>a+x.lordo,0));
  const subtot=r2(rows.reduce((a,x)=>a+x.netto,0));
  let sc=qq.scontoTipo==="%"?r2(subtot*Math.min(100,n(qq.sconto))/100):Math.min(subtot,r2(n(qq.sconto)));
  let imp=r2(subtot-sc);
  const iva=n(qq.iva);
  let tot=r2(imp*(1+iva/100));
  const step=n(qq.arr);let arr=0;
  if(step>0&&tot>0){const t2=Math.floor(tot/step)*step;arr=r2(t2-tot);
    // l'arrotondamento è un ulteriore sconto: ricalcola imponibile e IVA a ritroso
    imp=r2(t2/(1+iva/100));sc=r2(subtot-imp);tot=t2;}
  const ivaV=r2(tot-imp);
  return{rows,sub,listino,subtot,sc,imp,ivaV,tot,arr,risparmio:r2(listino-imp)};
}

/* ---------- binding form preventivo ---------- */
const QF=["tipo","connFinale","voipTitolo","connNote","connDurata","numero","data","validita","rev","oggetto","titoloTab","layout","totIva","sconto","scontoTipo","iva","arr","show","note","pag","tempi","cond"];
const CF=["nome","piva","cf","legale","esecutiva","ref","tel","email","sdi"];
function fillForm(){
  QF.forEach(k=>$("#q_"+k).value=q[k]??"");
  CF.forEach(k=>$("#c_"+k).value=q.cliente[k]??"");
  $("#q_showImg").checked=!!q.showImg;$("#q_showListino").checked=!!q.showListino;$("#q_dataTab").checked=!!q.dataTab;
  applyTipo();renderRows();renderConnRows();renderSheet();fillStato();
}
QF.forEach(k=>$("#q_"+k).addEventListener("input",e=>{q[k]=e.target.value;changed()}));
CF.forEach(k=>$("#c_"+k).addEventListener("input",e=>{q.cliente[k]=e.target.value;changed()}));
$("#q_showImg").addEventListener("change",e=>{q.showImg=e.target.checked;changed()});
$("#q_dataTab").addEventListener("change",e=>{q.dataTab=e.target.checked;changed()});
$("#q_showListino").addEventListener("change",e=>{q.showListino=e.target.checked;changed()});

let saveT;
function changed(rerenderRows){if(rerenderRows)renderRows();else updateRowTotals();renderSheet();clearTimeout(saveT);saveT=setTimeout(()=>store.set("bozza",q),300)}

/* ---------- preventivo "Connessione" (abbonamento servizi) ---------- */
const DEF_VOIP=()=>[["FISSI NAZIONALI",0.04],["MOBILI NAZIONALI",0.08],["RESTO DEL MONDO",0.35]].map(([label,prezzo])=>({id:uid(),label,prezzo}));
const voipDefault=()=>Array.isArray(az.voip)&&az.voip.length?az.voip.map(r=>({id:uid(),label:r.label,prezzo:r.prezzo})):DEF_VOIP();
const blankConn=()=>({id:uid(),titolo:"",dett:"",qta:1,una:0,can:0});
const blankVoip=()=>({id:uid(),label:"",prezzo:0});
function applyTipo(){
  document.body.classList.toggle("tconn",q.tipo==="conn");
  if(q.tipo==="conn"){if(!q.conn.length)q.conn.push(blankConn());if(!q.voip.length&&!q.voipOff)q.voip=voipDefault();
    if(!q.oggetto)q.oggetto="Proposta di abbonamento servizi di telecomunicazioni";$("#q_oggetto").value=q.oggetto}
}
function calcConn(qq){let una=0,can=0;(qq.conn||[]).forEach(r=>{una+=n(r.una)*n(r.qta);can+=n(r.can)*n(r.qta)});return{una:r2(una),can:r2(can)}}
function renderConnRows(){
  const box=$("#connRows");if(!box)return;
  box.innerHTML=q.conn.map((r,i)=>`<div class="row-card" data-i="${i}"><div class="row-fields" style="grid-column:1/-1">
    <textarea class="inp c4" data-k="titolo" rows="2" placeholder="Servizio / prodotto (anche su più righe)">${esc(r.titolo)}</textarea>
    <textarea class="inp c2" data-k="dett" rows="2" placeholder="Dettaglio piccolo a lato (facoltativo)">${esc(r.dett)}</textarea>
    <label class="f">Q.tà<input class="inp" data-k="qta" type="number" step="any" min="0" value="${esc(r.qta)}"></label>
    <label class="f c2">Una tantum €<input class="inp" data-k="una" type="number" step="0.01" min="0" value="${esc(r.una)}"></label>
    <label class="f c2">Canone mensile €<input class="inp" data-k="can" type="number" step="0.01" min="0" value="${esc(r.can)}"></label>
    <div class="row-tools"><button class="btn small" data-act="up">↑</button><button class="btn small" data-act="down">↓</button><button class="btn small" data-act="dup">Duplica</button><button class="btn small danger" data-act="del">Elimina</button></div>
  </div></div>`).join("")||`<div class="empty">Nessun servizio.</div>`;
  const t=calcConn(q);$("#connTot").innerHTML=`Totale una tantum <b>${eur.format(t.una)}</b> · canone mensile <b>${eur.format(t.can)}</b> (IVA esclusa)`;
  const vb=$("#voipRows");vb.innerHTML=q.voip.map((r,i)=>`<div class="row-card" data-i="${i}"><div class="row-fields" style="grid-column:1/-1">
    <input class="inp c4" data-k="label" value="${esc(r.label)}" placeholder="Destinazione (es. RESTO DEL MONDO)">
    <label class="f c2">Tariffa € / min<input class="inp" data-k="prezzo" type="number" step="0.001" min="0" value="${esc(r.prezzo)}"></label>
    <div class="row-tools"><button class="btn small" data-act="up">↑</button><button class="btn small" data-act="down">↓</button><button class="btn small danger" data-act="del">Elimina</button></div></div></div>`).join("")||`<div class="empty">Nessuna tariffa: la tabella VoIP non verrà mostrata.</div>`;
}
function listEditor(box,key,blank,after){
  box.addEventListener("input",e=>{const card=e.target.closest(".row-card"),k=e.target.dataset.k;if(!card||!k)return;q[key][+card.dataset.i][k]=e.target.value;
    const t=calcConn(q);$("#connTot").innerHTML=`Totale una tantum <b>${eur.format(t.una)}</b> · canone mensile <b>${eur.format(t.can)}</b> (IVA esclusa)`;changed()});
  box.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const L=q[key],i=+b.closest(".row-card").dataset.i,act=b.dataset.act;
    if(act==="del")L.splice(i,1);else if(act==="dup")L.splice(i+1,0,Object.assign({},L[i],{id:uid()}));
    else{const t=i+(act==="up"?-1:1);if(t<0||t>=L.length)return;[L[i],L[t]]=[L[t],L[i]]}
    if(key==="voip")q.voipOff=!q.voip.length;
    renderConnRows();changed()})
}
listEditor($("#connRows"),"conn");listEditor($("#voipRows"),"voip");
$("#bConnAdd").onclick=()=>{q.conn.push(blankConn());renderConnRows();changed()};
$("#bVoipSave").onclick=()=>{az.voip=q.voip.map(r=>({label:r.label,prezzo:r.prezzo}));store.set("azienda",az);toast("Listino VoIP salvato: sarà proposto nei nuovi preventivi di connessione")};
$("#bVoipAdd").onclick=()=>{q.voipOff=false;q.voip.push(blankVoip());renderConnRows();changed()};
$("#q_tipo").addEventListener("input",()=>{applyTipo();renderConnRows();changed()});

/* ---------- righe (editor) ---------- */
$("#webCat").innerHTML=Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
function renderRows(){
  const box=$("#rows");let h="";
  for(const cat of Object.keys(CATS)){
    const list=q.righe.filter(r=>r.cat===cat);
    h+=`<div class="cat-head">${CATS[cat]} <span class="pill">${list.length}</span><span class="sp"></span><button class="btn small" data-add="${cat}">+ Voce</button></div>`;
    if(!list.length)h+=`<div class="empty">Nessuna voce. Aggiungila a mano, dal listino o da un link web.</div>`;
    for(const r of list){
      const i=q.righe.indexOf(r);
      h+=`<div class="row-card${r.omaggio?" gift":""}" data-i="${i}">
        <div class="thumb" data-act="img" title="Cambia immagine">${r.img?`<img src="${esc(IS(r.img))}" alt="" referrerpolicy="no-referrer">`:"Aggiungi<br>immagine"}</div>
        <div class="row-fields">
          <input class="inp c2" data-k="codice" value="${esc(r.codice)}" placeholder="Codice / modello">
          <input class="inp c4" data-k="titolo" value="${esc(r.titolo)}" placeholder="Descrizione breve">
          <textarea class="inp c6" data-k="descr" rows="2" placeholder="Dettagli: ogni riga diventa un punto elenco">${esc(r.descr)}</textarea>
          <label class="f">${r.cat==="man"?"Ore / Q.tà":"Q.tà"}<input class="inp" data-k="qta" type="number" step="any" min="0" value="${esc(r.qta)}"></label>
          <label class="f">U.M.<input class="inp" data-k="um" value="${esc(r.um)}"></label>
          <label class="f c2">Prezzo unit. €<input class="inp" data-k="prezzo" type="number" step="0.01" min="0" value="${esc(r.prezzo)}"></label>
          <label class="f">Sconto %<input class="inp" data-k="sconto" type="number" step="0.01" min="0" max="100" value="${esc(r.sconto)}"></label>
          ${r.cat==="man"?`<label class="f">Tecnici<input class="inp" data-k="pers" type="number" step="1" min="1" value="${esc(r.pers||1)}"></label>`:""}
          <label class="f">Categoria<select class="inp" data-k="cat">${Object.entries(CATS).map(([k,v])=>`<option value="${k}"${k===r.cat?" selected":""}>${v.split(" ")[0]}</option>`).join("")}</select></label>
          <div class="row-tools">
            <label class="chk"><input type="checkbox" data-k="omaggio"${r.omaggio?" checked":""}> Omaggio (prezzo azzerato)</label>
            <button class="btn small" data-act="up" title="Sposta su">↑</button><button class="btn small" data-act="down" title="Sposta giù">↓</button>
            <button class="btn small" data-act="dup">Duplica</button>
            <button class="btn small" data-act="tocat" title="Salva questa voce nel listino">→ Listino</button>
            <button class="btn small danger" data-act="del">Elimina</button>
            <span class="tot" data-tot></span>
          </div>
        </div></div>`;
    }
  }
  box.innerHTML=h;updateRowTotals();
}
function updateRowTotals(){
  const c=calc(q);
  $$("#rows .row-card").forEach(el=>{const x=c.rows[+el.dataset.i];if(!x)return;
    el.querySelector("[data-tot]").innerHTML=x.r.omaggio?`<span style="color:var(--ok)">Omaggio</span> <s class="muted">${eur.format(x.lordo)}</s>`:(x.netto!==x.lordo?`<s class="muted">${eur.format(x.lordo)}</s> ${eur.format(x.netto)}`:eur.format(x.netto));
    el.classList.toggle("gift",!!x.r.omaggio);});
}
$("#rows").addEventListener("input",e=>{
  const card=e.target.closest(".row-card"),k=e.target.dataset.k;if(!card||!k)return;
  const r=q.righe[+card.dataset.i];
  if(k==="omaggio"){r.omaggio=e.target.checked;changed();return}
  if(k==="cat"){r.cat=e.target.value;if(r.cat==="man"&&!r.img)r.img=IMG.tools;changed(true);return}
  r[k]=e.target.value;changed();
});
$("#rows").addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");if(add){q.righe.push(blankRow(add.dataset.add));changed(true);return}
  const b=e.target.closest("[data-act]");if(!b)return;
  const i=+b.closest(".row-card").dataset.i,r=q.righe[i],act=b.dataset.act;
  if(act==="del"){q.righe.splice(i,1);changed(true)}
  else if(act==="dup"){q.righe.splice(i+1,0,Object.assign({},r,{id:uid()}));changed(true)}
  else if(act==="up"||act==="down"){const same=q.righe.map((x,j)=>j).filter(j=>q.righe[j].cat===r.cat);const p=same.indexOf(i),t=same[p+(act==="up"?-1:1)];if(t==null)return;[q.righe[i],q.righe[t]]=[q.righe[t],q.righe[i]];changed(true)}
  else if(act==="tocat"){catalog.push({id:uid(),cat:r.cat,codice:r.codice||"",titolo:r.titolo,descr:r.descr,um:r.um,prezzo:n(r.prezzo),pers:n(r.pers)||1,img:r.img});store.set("listino",catalog);toast("Voce aggiunta al listino")}
  else if(act==="img")imageDialog(r);
});

/* ---------- immagini ---------- */
function resizeFile(file,max){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const cv=document.createElement("canvas");cv.width=Math.round(im.width*s);cv.height=Math.round(im.height*s);const ctx=cv.getContext("2d");ctx.drawImage(im,0,0,cv.width,cv.height);const png=file.type==="image/png"||file.type==="image/svg+xml";res(cv.toDataURL(png?"image/png":"image/jpeg",.85))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
function imageDialog(r){
  const q1=encodeURIComponent((r.titolo||"")+" "+(r.codice||""));
  modal(`<h3>Immagine della voce</h3>
   <div class="grid">
    <label class="f full">Indirizzo dell'immagine (tasto destro sull'immagine → «Copia indirizzo immagine»)<input id="mImgUrl" class="inp" value="${r.img&&!r.img.startsWith("data:")?esc(r.img):""}" placeholder="https://…/foto.jpg"></label>
    <div class="full" style="display:flex;gap:6px;flex-wrap:wrap">
     <button class="btn" id="mImgFile">Carica dal computer</button>
     <a class="btn" href="https://www.google.com/search?tbm=isch&q=${q1}" target="_blank" rel="noopener">Cerca su Google Immagini</a>
     <button class="btn danger" id="mImgDel">Rimuovi immagine</button>
    </div>
    <p class="hint full">Puoi anche incollare un'immagine copiata (Ctrl+V) mentre questa finestra è aperta.</p>
   </div>
   <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Annulla</button><button class="btn primary" id="mImgOk">Usa questo indirizzo</button></div>`);
  const done=v=>{r.img=v;closeModal();changed(true)};
  $("#mImgOk").onclick=()=>done($("#mImgUrl").value.trim());
  $("#mImgDel").onclick=()=>done("");
  $("#mImgFile").onclick=()=>{const f=$("#fileImg");f.value="";f.onchange=async()=>{if(f.files[0])done(await resizeFile(f.files[0],800))};f.click()};
  pasteHandler=async e=>{const it=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith("image/"));if(it){e.preventDefault();done(await resizeFile(it.getAsFile(),800))}};
}
let pasteHandler=null;
document.addEventListener("paste",e=>{if(pasteHandler)pasteHandler(e)});

/* ---------- import dal web ---------- */
async function fetchMeta(url){
  // 1) Microlink: legge i metadati Open Graph (titolo, descrizione, immagine)
  try{
    const res=await fetch("https://api.microlink.io/?url="+encodeURIComponent(url));
    const j=await res.json();
    if(j.status==="success"&&j.data&&(j.data.title||j.data.description)){
      return{titolo:j.data.title||"",descr:j.data.description||"",img:(j.data.image&&j.data.image.url)||(j.data.logo&&j.data.logo.url)||"",prezzo:0};
    }
  }catch(e){}
  // 2) Jina Reader come riserva
  try{
    const res=await fetch("https://r.jina.ai/"+url,{headers:{"Accept":"application/json"}});
    const j=await res.json();const d=j.data||{};
    const content=d.content||"";
    const img=(content.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/)||[])[1]||"";
    const para=content.split("\n").map(s=>s.trim()).find(s=>s.length>60&&!s.startsWith("!")&&!s.startsWith("[")&&!s.startsWith("#"))||"";
    const pr=(content.match(/(\d{1,3}(?:\.\d{3})*,\d{2})\s?€|€\s?(\d{1,3}(?:\.\d{3})*,\d{2})/)||[]);
    const prezzo=pr[1]||pr[2]?n((pr[1]||pr[2]).replace(/\./g,"")):0;
    if(d.title||para)return{titolo:d.title||"",descr:d.description||para.slice(0,300),img,prezzo};
  }catch(e){}
  return null;
}
$("#bWeb").addEventListener("click",async()=>{
  let url=$("#webUrl").value.trim();if(!url){toast("Incolla prima il link della pagina prodotto");return}
  if(!/^https?:\/\//i.test(url))url="https://"+url;
  const b=$("#bWeb");b.disabled=true;b.textContent="Lettura…";
  const m=await fetchMeta(url);b.disabled=false;b.textContent="Importa";
  const r=blankRow($("#webCat").value);r.link=url;
  if(m){Object.assign(r,{titolo:m.titolo.slice(0,160),descr:m.descr.slice(0,400),img:m.img,prezzo:m.prezzo||0});toast(m.prezzo?"Voce importata, prezzo trovato: verificalo":"Voce importata: inserisci il prezzo")}
  else{r.titolo="";r.descr=url;toast("Il sito non consente la lettura automatica: completa la voce a mano")}
  q.righe.push(r);$("#webUrl").value="";changed(true);
});

/* ---------- documento A4 ---------- */
const eurP=v=>"€ "+eur.format(v).replace(/\s?€/,"").trim();
function lmDesc(r){
  const head=r.codice&&r.titolo?`<b>${esc(r.codice)}</b> - ${esc(r.titolo)}`:r.codice?`<b>${esc(r.codice)}</b>`:r.titolo?`<b>${esc(r.titolo)}</b>`:"";
  const lines=String(r.descr||"").split("\n").map(x=>x.replace(/^\s*[-•*]\s*/,"").trim()).filter(Boolean);
  let h=head?`<div class="ln">${head}</div>`:"";
  if(lines.length>1||(!head&&lines.length))h+=`<ul>${lines.map(l=>`<li>-&nbsp;&nbsp;&nbsp;&nbsp;${esc(l)}</li>`).join("")}</ul>`;
  else if(lines.length)h+=`<div class="sub">${esc(lines[0])}</div>`;
  return h||"<span style='color:#999'>Voce senza descrizione</span>";
}
function lmPrice(x){
  const r=x.r,pz=eurP(n(r.prezzo)),qt=n(r.qta),pers=n(r.pers)||1,um=String(r.um||"").trim().toLowerCase();
  let h;
  if(r.cat==="man"||um==="h"||um==="ore"){h=`${pz} x ${um==="h"||um==="ore"?"ore ":(um&&um!=="pz"?um+" ":"")}${num.format(qt)}`;if(r.cat==="man"&&pers>1)h+=`<br>${pers} tecnici`}
  else h=qt!==1?`${pz} x${num.format(qt)}`:pz;
  if(!r.omaggio&&n(r.sconto)>0)h+=`<br><span style="color:#a15c00">sconto ${num.format(n(r.sconto))}%</span>`;
  return h;
}
const pgFootHtml=()=>{if(!hasFoot())return "";const f=footLines(),row=a=>a.map(([l,v])=>`<div>${l?`<b>${l}</b>`:""}${esc(v)}</div>`).join("");
  return `<div class="pgsp"></div><div class="pgfoot" style="--ft-line:${esc(footRgb())}"><div class="pfh"><span class="pfn">${esc(f.name)}</span><span class="pfp">1</span></div><div class="pfc"><div>${row(f.L)}</div><div class="pfr">${row(f.R)}</div></div></div>`};
function renderConn(){
  const cl=q.cliente,t=calcConn(q),anyDett=q.conn.some(r=>String(r.dett||"").trim());
  const nl=s=>esc(s).replace(/\n/g,"<br>");
  const rows=q.conn.map(r=>`<tr class="it">${anyDett?(String(r.dett||"").trim()?`<td class="ds">${nl(r.titolo)}</td><td class="dt">${nl(r.dett)}</td>`:`<td class="ds" colspan="2">${nl(r.titolo)}</td>`):`<td class="ds">${nl(r.titolo)}</td>`}
    <td class="cq">${num.format(n(r.qta))}</td><td class="cq">${eurP(n(r.una))}</td><td class="cq">${eurP(n(r.can))}</td></tr>`).join("")||`<tr><td colspan="4" style="text-align:center;color:#999">Aggiungi i servizi del preventivo</td></tr>`;
  const eurV=v=>"€ "+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:3}).format(v);
  const voip=q.voip.length?`<table class="cn" style="margin-top:7mm"><tr><td class="hd2" colspan="2">${esc(q.voipTitolo)}</td></tr>${q.voip.map(r=>`<tr><td class="ds">${esc(r.label)}</td><td class="cq" style="width:28mm">${eurV(n(r.prezzo))}</td></tr>`).join("")}</table>`:"";
  const note=[q.connNote,q.connDurata].filter(x=>String(x||"").trim());
  $("#sheet").innerHTML=`<div class="lm" style="--lm-col:${esc(az.colore||"#a4c2f4")}">
   <div class="lh"><div>${az.logo?`<img src="${esc(az.logo)}" alt="Logo">`:`<b style="font-size:16pt">${esc(az.nome)}</b>`}</div><div class="web">${esc(az.web)}</div></div>
   <div class="lp">
    <div class="ogg">OGGETTO:<br>${esc(q.oggetto)}</div>
    <div class="cli"><div class="cn">Spett. ${esc(cl.nome)}${cl.piva?`<br>p.iva ${esc(cl.piva)}`:""}</div>
     <div class="ca">${esc(cl.legale)}${cl.esecutiva?`<br>Sede esecutiva: ${esc(cl.esecutiva)}`:""}${cl.cf?`<br>C.F. ${esc(cl.cf)}`:""}${cl.sdi?`<br>Cod. SDI ${esc(cl.sdi)}`:""}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}</div></div>
   </div>
   <div class="pn">Preventivo ${esc(q.numero)}${q.rev?" "+esc(q.rev):""} del ${fmtDate(q.data)}</div>
   <table class="cn"><tr><td class="hd2"${anyDett?' colspan="2"':""}>SERVIZIO/PRODOTTO</td><td class="hd2 c">QUANTITA'</td><td class="hd2 c">UNA TANTUM</td><td class="hd2 c">CANONE MENSILE</td></tr>
    ${rows}
    <tr class="fin"><td class="tl2" colspan="${anyDett?3:2}">${esc(q.connFinale)}</td><td class="ta2">${eurP(t.una)}</td><td class="ta2">${eurP(t.can)}</td></tr></table>
   ${voip}
   ${note.length?`<div class="cnote">${note.map(x=>`<span>${esc(x)}</span>`).join("<span>-</span>")}</div>`:""}
   ${az.foot?`<div class="after" style="color:#666;font-size:8pt">${esc(az.foot)}</div>`:""}
   ${pgFootHtml()}
  </div>`;
}
function renderLumia(c){
  const cl=q.cliente,lw=q.showImg;const cols=lw?4:3;
  const rows=Object.keys(CATS).flatMap(k=>c.rows.filter(x=>x.r.cat===k));
  const disc=c.listino>c.subtot;
  let tot=`<u>${eurP(c.imp)} +iva</u>`;
  if(q.totIva==="dettaglio")tot=`<span class="sm">Imponibile ${eurP(c.imp)}</span><span class="sm">IVA ${num.format(n(q.iva))}% ${eurP(c.ivaV)}</span><u>${eurP(c.tot)} iva incl.</u>`;
  let pre="";
  if(c.sc>0||disc&&q.showListino)pre=`<span class="sm">${disc&&q.showListino?"Listino "+eurP(c.listino):"Subtotale "+eurP(c.subtot)}</span>`+
    (disc&&q.showListino?`<span class="sm">Sconti voci − ${eurP(r2(c.listino-c.subtot))}</span>`:"")+(c.sc>0?`<span class="sm">Sconto${q.scontoTipo==="%"&&n(q.sconto)?" "+num.format(n(q.sconto))+"%":""} − ${eurP(c.sc)}</span>`:"");
  const after=[q.tempi&&`<b>Tempi</b>${esc(q.tempi)}`,q.pag&&`<b>Pagamento</b>${esc(q.pag)}${az.iban?" – IBAN "+esc(az.iban):""}`,q.cond&&`<b>Condizioni</b>${esc(q.cond)}`].filter(Boolean).join("");
  $("#sheet").innerHTML=`<div class="lm" style="--lm-col:${esc(az.colore||"#a4c2f4")}">
   <div class="lh"><div>${az.logo?`<img src="${esc(az.logo)}" alt="Logo">`:`<b style="font-size:16pt">${esc(az.nome)}</b>`}</div><div class="web">${esc(az.web)}</div></div>
   <div class="lp">
    <div class="ogg">OGGETTO:<br>${esc(q.oggetto)}</div>
    <div class="cli"><div class="cn">Spett.${esc(cl.nome)}${cl.piva?`<br>p.iva ${esc(cl.piva)}`:""}</div>
     <div class="ca">${esc(cl.legale)}${cl.esecutiva?`<br>Sede esecutiva: ${esc(cl.esecutiva)}`:""}${cl.cf?`<br>C.F. ${esc(cl.cf)}`:""}${cl.sdi?`<br>Cod. SDI ${esc(cl.sdi)}`:""}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}</div></div>
   </div>
   <div class="pn">Preventivo ${esc(q.numero)}${q.rev?" "+esc(q.rev):""} del ${fmtDate(q.data)}</div>
   <table>
    <tr>${q.dataTab?`<td class="hd" style="width:${lw?"25mm":"30mm"}">${fmtDate(q.data)}</td>`:""}<td class="hd" colspan="${q.dataTab?cols-1:cols}">PREVENTIVO ${esc(q.titoloTab).toUpperCase()}</td></tr>
    <tr>${lw?"<th>IMMAGINE</th>":""}<th>DESCRIZIONE</th><th>PREZZO CAD</th><th>TOT</th></tr>
    ${rows.map(x=>{const r=x.r,img=r.img||(r.cat==="man"?IMG.tools:"");return `<tr class="it">${lw?`<td class="im">${img?`<img src="${esc(IS(img))}" alt="" referrerpolicy="no-referrer">`:""}</td>`:""}
      <td class="ds">${lmDesc(r)}</td><td class="pr">${lmPrice(x)}</td>
      <td class="tt">${r.omaggio?`<s>${eurP(x.lordo)}</s><span class="gift">OMAGGIO</span>`:(x.netto!==x.lordo&&q.showListino?`<s>${eurP(x.lordo)}</s>`:"")+(r.omaggio?"":eurP(x.netto))}</td></tr>`}).join("")||`<tr><td colspan="${cols}" style="text-align:center;color:#999">Aggiungi le voci del preventivo</td></tr>`}
    <tr><td class="nt" colspan="${cols-1}" rowspan="2">${esc(q.note)}</td><td class="tl">Totale</td></tr>
    <tr><td class="ta">${pre}${tot}</td></tr>
   </table>
   ${after?`<div class="after">${after}</div>`:""}
   ${az.foot?`<div class="after" style="color:#666;font-size:8pt">${esc(az.foot)}</div>`:""}
   ${pgFootHtml()}
  </div>`;
}
function renderSheet(){
  if(q.tipo==="conn"){renderConn();return}
  const c=calc(q),cl=q.cliente,show=q.show;
  if(q.layout!=="classico"){renderLumia(c);return}
  const scad=q.data&&n(q.validita)?(()=>{const d=new Date(q.data);d.setDate(d.getDate()+n(q.validita));return d.toISOString().slice(0,10)})():"";
  const cols=show==="all"?6:show==="tot"?4:3;
  const useImg=q.showImg&&q.righe.some(r=>r.img);const colsImg=useImg?1:0;
  let rowsH="";
  for(const cat of Object.keys(CATS)){
    const list=c.rows.filter(x=>x.r.cat===cat);if(!list.length)continue;
    rowsH+=`<tr class="cat"><td colspan="${cols+colsImg}">${CATS[cat]}</td></tr>`;
    for(const x of list){const r=x.r;const disc=!r.omaggio&&n(r.sconto)>0;
      rowsH+=`<tr>${useImg?`<td style="width:19mm">${r.img?`<img class="pimg" src="${esc(IS(r.img))}" alt="" referrerpolicy="no-referrer">`:""}</td>`:""}
       <td><div class="ititle">${esc(r.titolo)||"<span style='color:#999'>Voce senza titolo</span>"}</div>${r.descr?`<div class="idesc">${esc(r.descr)}</div>`:""}
        ${r.omaggio?`<span class="tag">Omaggio</span>`:disc?`<span class="tag sc">Sconto ${num.format(n(r.sconto))}%</span>`:""}</td>
       <td class="num">${num.format(n(r.qta))}</td><td>${esc(r.um)}</td>
       ${show==="all"?`<td class="num">${eur.format(n(r.prezzo))}</td><td class="num">${disc?num.format(n(r.sconto))+"%":r.omaggio?"100%":"–"}</td>`:""}
       ${show!=="none"?`<td class="num">${(r.omaggio||disc)&&q.showListino?`<span class="old">${eur.format(x.lordo)}</span>`:""}${r.omaggio?"0,00 €":eur.format(x.netto)}</td>`:""}</tr>`;
    }
  }
  const anyDisc=c.listino>c.subtot;
  $("#sheet").innerHTML=`
   <div class="hdr">
    <div class="az">${az.logo?`<img class="logo" src="${esc(az.logo)}" alt="Logo">`:""}<b>${esc(az.nome)}</b><br>
      ${esc(az.sede)}${az.oper?`<br>Sede operativa: ${esc(az.oper)}`:""}<br>
      P.IVA ${esc(az.piva)}${az.cf&&az.cf!==az.piva.replace(/^IT/,"")?` · C.F. ${esc(az.cf)}`:""}<br>
      ${[az.tel&&"Tel. "+esc(az.tel),esc(az.email),esc(az.web)].filter(Boolean).join(" · ")}</div>
    <div class="docid"><div class="t">PREVENTIVO</div><div class="n">N. ${esc(q.numero)}${q.rev?` – ${esc(q.rev)}`:""}</div>
      <div class="d">Data ${fmtDate(q.data)}${scad?`<br>Valido fino al ${fmtDate(scad)}`:""}</div></div>
   </div>
   <div class="parties">
    <div class="box"><div class="lbl">Cliente</div><b>${esc(cl.nome)||"—"}</b><br>
      ${cl.piva?`P.IVA ${esc(cl.piva)}`:""}${cl.cf&&cl.cf!==cl.piva.replace(/^IT/,"")?`${cl.piva?" · ":""}C.F. ${esc(cl.cf)}`:""}
      ${cl.sdi?`<br>Cod. SDI ${esc(cl.sdi)}`:""}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}
      ${cl.tel||cl.email?`<br>${[esc(cl.tel),esc(cl.email)].filter(Boolean).join(" · ")}`:""}</div>
    <div class="box"><div class="lbl">Sede legale</div>${esc(cl.legale)||"—"}
      <div class="lbl" style="margin-top:2mm">Sede esecutiva</div>${esc(cl.esecutiva)||(cl.legale?"Coincide con la sede legale":"—")}</div>
   </div>
   ${q.oggetto?`<div class="ogg"><span>Oggetto</span>${esc(q.oggetto)}</div>`:""}
   <table class="items"><thead><tr>${useImg?"<th></th>":""}<th>Descrizione</th><th class="num">Q.tà</th><th>U.M.</th>
     ${show==="all"?`<th class="num">Prezzo unit.</th><th class="num">Sc.</th>`:""}${show!=="none"?`<th class="num">Importo</th>`:""}</tr></thead>
    <tbody>${rowsH||`<tr><td colspan="${cols+colsImg}" style="color:#999;padding:6mm 0;text-align:center">Aggiungi le voci del preventivo</td></tr>`}</tbody></table>
   <div class="bottom">
    <div class="notes">
     ${q.note?`<p class="lbl">Note</p>${esc(q.note)}<br><br>`:""}
     ${q.pag?`<p class="lbl">Pagamento</p>${esc(q.pag)}${az.iban?`<br>IBAN ${esc(az.iban)}`:""}<br><br>`:""}
     ${q.tempi?`<p class="lbl">Tempi</p>${esc(q.tempi)}<br><br>`:""}
     ${q.cond?`<p class="lbl">Condizioni</p>${esc(q.cond)}`:""}
    </div>
    <div>
     <table class="tot">
      ${anyDisc&&q.showListino?`<tr><td>Totale a listino</td><td class="num">${eur.format(c.listino)}</td></tr><tr class="disc"><td>Sconti e omaggi sulle voci</td><td class="num">− ${eur.format(r2(c.listino-c.subtot))}</td></tr>`:""}
      ${Object.keys(CATS).filter(k=>q.righe.some(r=>r.cat===k)).length>1?Object.keys(CATS).filter(k=>q.righe.some(r=>r.cat===k)).map(k=>`<tr><td>${CATS[k]}</td><td class="num">${eur.format(c.sub[k])}</td></tr>`).join(""):""}
      <tr><td><b>Totale voci</b></td><td class="num"><b>${eur.format(c.subtot)}</b></td></tr>
      ${c.sc>0?`<tr class="disc"><td>Sconto${q.scontoTipo==="%"&&n(q.sconto)?" "+num.format(n(q.sconto))+"%":""}${c.arr?" e arrotondamento":""}</td><td class="num">− ${eur.format(c.sc)}</td></tr>`:""}
      <tr><td>Imponibile</td><td class="num">${eur.format(c.imp)}</td></tr>
      <tr><td>IVA ${num.format(n(q.iva))}%</td><td class="num">${eur.format(c.ivaV)}</td></tr>
      <tr class="grand"><td>Totale</td><td class="num">${eur.format(c.tot)}</td></tr>
     </table>
     ${c.risparmio>0.009?`<div class="save">Risparmio sul prezzo di listino: ${eur.format(c.risparmio)} + IVA</div>`:""}
    </div>
   </div>
   <div class="sign"><div>Luogo e data</div><div>Per accettazione (timbro e firma del cliente)</div></div>
   ${az.foot?`<div class="foot">${esc(az.foot)}</div>`:""}
   ${pgFootHtml()}`;
}

/* ---------- listino ---------- */
const gruppoDi=x=>x.gruppo||(x.cat==="man"?"Manodopera":x.cat==="acc"?"Accessori":"Altri prodotti");
function fillCatFilter(){const cur=$("#catFilter").value;const gs=[...new Set(catalog.map(gruppoDi))].sort();
  $("#catFilter").innerHTML=`<option value="">Tutti i gruppi</option>`+gs.map(g=>`<option value="g:${esc(g)}">${esc(g)} (${catalog.filter(x=>gruppoDi(x)===g).length})</option>`).join("")+`<option value="nop">Senza prezzo</option>`;
  $("#catFilter").value=cur}
function catList(){const s=$("#catSearch").value.toLowerCase().trim(),f=$("#catFilter").value;
  return catalog.filter(x=>(!f||(f==="nop"?!n(x.prezzo):gruppoDi(x)===f.slice(2)))&&(!s||s.split(/\s+/).every(w=>[x.codice,x.titolo,x.descr,x.info,x.marca,x.gruppo].join(" ").toLowerCase().includes(w))))}
function renderCatalog(){
  fillCatFilter();const list=catList();$("#catCount").textContent=list.length+" voci";
  const show=list.slice(0,300);
  $("#catTable").innerHTML=`<tr><th></th><th>Gruppo</th><th>Codice</th><th>Articolo</th><th>U.M.</th><th class="num">Costo</th><th class="num">Prezzo</th><th></th></tr>`+
   (show.length?show.map(x=>`<tr data-id="${x.id}"><td>${x.img?`<img class="mini" src="${esc(IS(x.img))}" alt="" loading="lazy" referrerpolicy="no-referrer">`:""}</td>
    <td style="font-size:12px">${esc(gruppoDi(x))}</td><td style="font-family:var(--mono)">${esc(x.codice)}</td>
    <td><b>${esc(x.titolo||lbl(x))}</b>${x.descr?`<br><span class="muted">${esc(x.descr)}</span>`:""}${x.info?`<br><span class="muted" style="font-size:12px">${esc(x.info.slice(0,140))}</span>`:""}${x.fonte?` <a href="${esc(x.fonte)}" target="_blank" rel="noopener" style="font-size:12px">fonte</a>`:""}</td><td>${esc(x.um)}</td>
    <td class="num muted">${x.costo!=null&&n(x.costo)?eur.format(n(x.costo)):"–"}</td>
    <td class="num">${n(x.prezzo)?eur.format(n(x.prezzo)):`<span style="color:var(--warn)">da inserire</span>`}</td>
    <td style="white-space:nowrap"><button class="btn small" data-c="use">Al preventivo</button> <button class="btn small" data-c="edit">Modifica</button> <button class="btn small danger" data-c="del">Elimina</button></td></tr>`).join("")
   :`<tr><td colspan="8" class="muted">Nessuna voce trovata.</td></tr>`)+(list.length>300?`<tr><td colspan="8" class="muted">Mostrate le prime 300 voci: usa la ricerca o il filtro per gruppo.</td></tr>`:"");
}
$("#catSearch").addEventListener("input",renderCatalog);$("#catFilter").addEventListener("change",renderCatalog);
$("#bRicarico").onclick=()=>{const r=n($("#ricarico").value),list=catList().filter(x=>n(x.costo??x.prezzo)>0);
  if(!list.length){toast("Nessuna voce con costo tra quelle mostrate");return}
  confirmBox(`Applicare il ricarico del ${num.format(r)}% a ${list.length} voci?`,()=>{list.forEach(x=>{if(x.costo==null)x.costo=n(x.prezzo);x.prezzo=r2(n(x.costo)*(1+r/100))});store.set("listino",catalog);renderCatalog();toast("Prezzi aggiornati")})};
$("#catTable").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;const id=b.closest("tr").dataset.id,x=catalog.find(c=>c.id===id);
  if(b.dataset.c==="del"){catalog=catalog.filter(c=>c.id!==id);store.set("listino",catalog);renderCatalog()}
  else if(b.dataset.c==="edit")catEdit(x);
  else{q.righe.push(Object.assign(blankRow(),pick(x),{qta:1}));changed(true);toast("Aggiunta al preventivo: "+lbl(x))}});
$("#bCatAdd").onclick=()=>catEdit(null);
function catEdit(x){
  const it=x?Object.assign({},x):{id:uid(),cat:"mat",gruppo:"",codice:"",titolo:"",descr:"",um:"pz",costo:0,prezzo:0,img:""};
  modal(`<h3>${x?"Modifica voce":"Nuova voce di listino"}</h3><div class="grid">
   <label class="f">Categoria<select id="e_cat" class="inp">${Object.entries(CATS).map(([k,v])=>`<option value="${k}"${k===it.cat?" selected":""}>${v}</option>`).join("")}</select></label>
   <label class="f">Gruppo<input id="e_gruppo" class="inp" value="${esc(it.gruppo||"")}" list="dlGruppi"><datalist id="dlGruppi">${[...new Set(catalog.map(gruppoDi))].map(g=>`<option value="${esc(g)}">`).join("")}</datalist></label>
   <label class="f">Codice / modello<input id="e_codice" class="inp" value="${esc(it.codice)}"></label>
   <label class="f">Unità di misura<input id="e_um" class="inp" value="${esc(it.um)}" placeholder="pz, m, h, kit…"></label>
   <label class="f full">Descrizione breve<input id="e_titolo" class="inp" value="${esc(it.titolo)}"></label>
   <label class="f full">Dettagli (una riga per punto elenco)<textarea id="e_descr" class="inp" rows="2">${esc(it.descr)}</textarea></label>
   <label class="f">Costo d'acquisto €<input id="e_costo" class="inp" type="number" step="0.01" value="${esc(it.costo??"")}"></label>
   <label class="f">Prezzo di vendita €<input id="e_prezzo" class="inp" type="number" step="0.01" value="${esc(it.prezzo)}"></label>
   <label class="f full">Immagine (indirizzo web o file nella cartella img)<input id="e_img" class="inp" value="${it.img&&!it.img.startsWith("data:")?esc(it.img):""}" placeholder="${(it.img||"").startsWith("data:")?"Immagine caricata dal computer":"https://…"}"></label>
   <label class="f full">Oppure leggi da pagina web<div style="display:flex;gap:6px"><input id="e_url" class="inp" placeholder="https://…" value="${esc(it.fonte||"")}"><button class="btn" id="e_fetch">Leggi</button></div></label>
   ${it.info?`<p class="hint full">${esc(it.info)}</p>`:""}
  </div><div style="display:flex;gap:6px;justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Annulla</button><button class="btn primary" id="e_ok">Salva</button></div>`);
  $("#e_fetch").onclick=async()=>{let u=$("#e_url").value.trim();if(!u)return;if(!/^https?:/i.test(u))u="https://"+u;$("#e_fetch").textContent="…";const m=await fetchMeta(u);$("#e_fetch").textContent="Leggi";
    if(!m){toast("Lettura non riuscita su questo sito");return}if(m.titolo)$("#e_titolo").value=m.titolo;if(m.descr)$("#e_descr").value=m.descr;if(m.img)$("#e_img").value=m.img;if(m.prezzo)$("#e_costo").value=m.prezzo};
  $("#e_ok").onclick=()=>{["cat","gruppo","codice","titolo","descr","um"].forEach(k=>it[k]=$("#e_"+k).value.trim());it.prezzo=n($("#e_prezzo").value);it.costo=$("#e_costo").value===""?null:n($("#e_costo").value);
    const im=$("#e_img").value.trim();if(im||!(it.img||"").startsWith("data:"))it.img=im;
    const i=catalog.findIndex(c=>c.id===it.id);if(i>=0)catalog[i]=it;else catalog.push(it);store.set("listino",catalog);closeModal();renderCatalog();toast("Listino aggiornato")};
}
$("#bFromCat").onclick=()=>{
  const gs=[...new Set(catalog.map(gruppoDi))].sort();
  modal(`<h3>Aggiungi dal listino</h3><div style="display:flex;gap:6px;margin-bottom:8px"><input id="pkS" class="inp" placeholder="Cerca codice o modello…"><select id="pkG" class="inp" style="width:auto"><option value="">Tutti i gruppi</option>${gs.map(g=>`<option>${esc(g)}</option>`).join("")}</select></div><div id="pkL" style="max-height:60vh;overflow:auto"></div>
   <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Chiudi</button></div>`);
  const draw=()=>{const s=$("#pkS").value.toLowerCase().trim(),g=$("#pkG").value;
    const l=catalog.filter(x=>(!g||gruppoDi(x)===g)&&(!s||s.split(/\s+/).every(w=>[x.codice,x.titolo,x.descr,x.info,x.marca].join(" ").toLowerCase().includes(w))));
    const by={};l.slice(0,200).forEach(x=>(by[gruppoDi(x)]=by[gruppoDi(x)]||[]).push(x));
    $("#pkL").innerHTML=Object.keys(by).sort().map(gr=>`<div class="cat-head">${esc(gr)}</div>`+by[gr].map(x=>`<div class="picker-item" data-id="${x.id}">${x.img?`<img class="mini" src="${esc(IS(x.img))}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="mini"></span>`}<div><b>${esc(lbl(x))}</b><br><span class="muted">${esc((x.info||x.descr||"").split("\n")[0].slice(0,90))}</span></div><span class="p">${n(x.prezzo)?eur.format(n(x.prezzo)):"da inserire"}</span></div>`).join("")).join("")||`<p class="muted">Nessuna voce trovata.</p>`};
  draw();$("#pkS").oninput=draw;$("#pkG").onchange=draw;$("#pkS").focus();
  $("#pkL").onclick=e=>{const it=e.target.closest(".picker-item");if(!it)return;const x=catalog.find(c=>c.id===it.dataset.id);q.righe.push(Object.assign(blankRow(),pick(x),{qta:1}));changed(true);toast("Aggiunta: "+lbl(x))};
};
/* CSV */
function csvParse(t){const sep=(t.split("\n")[0].match(/;/g)||[]).length>=(t.split("\n")[0].match(/,/g)||[]).length?";":",";const rows=[];let row=[],cur="",inq=false;
  for(let i=0;i<t.length;i++){const ch=t[i];if(inq){if(ch==='"'){if(t[i+1]==='"'){cur+='"';i++}else inq=false}else cur+=ch}else if(ch==='"')inq=true;else if(ch===sep){row.push(cur);cur=""}else if(ch==="\n"){row.push(cur.replace(/\r$/,""));rows.push(row);row=[];cur=""}else cur+=ch}
  if(cur||row.length){row.push(cur);rows.push(row)}return rows.filter(r=>r.some(c=>c.trim()))}
$("#bCatImport").onclick=()=>{const f=$("#fileCsv");f.value="";f.onchange=()=>{const file=f.files[0];if(!file)return;const fr=new FileReader();fr.onload=()=>{
  const rows=csvParse(String(fr.result).replace(/^﻿/,""));if(!rows.length)return;let start=0;if(/categ/i.test(rows[0][0]))start=1;let k=0;
  for(const r of rows.slice(start)){const cat=CAT_CSV[(r[0]||"").trim().toLowerCase()]||"mat";catalog.push({id:uid(),cat,codice:(r[1]||"").trim(),titolo:(r[2]||"").trim(),descr:(r[3]||"").trim(),um:(r[4]||"pz").trim(),prezzo:n((r[5]||"0").replace(/\.(?=\d{3}(\D|$))/g,"")),img:(r[6]||"").trim()});k++}
  store.set("listino",catalog);renderCatalog();toast(k+" voci importate")};fr.readAsText(file)};f.click()};
$("#bCatExport").onclick=()=>{const q2=v=>`"${String(v??"").replace(/"/g,'""')}"`;const inv={mat:"materiali",man:"manodopera",acc:"accessori"};
  const txt="categoria;codice;titolo;descrizione;um;prezzo;immagine\n"+catalog.map(x=>[inv[x.cat],x.codice,x.titolo,x.descr,x.um,String(n(x.prezzo)).replace(".",","),x.img&&x.img.startsWith("data:")?"":x.img].map(q2).join(";")).join("\n");
  saveFile("listino.csv",txt,"text/csv")};

/* ---------- PDF: salvataggio e riapertura ---------- */
const PDF_MARK="%LUMIA-PREVENTIVO:";
function fileName(){return (`Preventivo ${q.numero} - ${q.cliente.nome||"cliente"}`).replace(/[\\/:*?"<>|]+/g,"-").replace(/[.\s]+$/,"").slice(0,120)+".pdf"}

/* piè di pagina a due colonne (nome, P.IVA, capitale, PEC | sede, tel, email) */
const footRgb=()=>{const h=(az.colore||"#a4c2f4").replace("#",""),c=[0,2,4].map(i=>parseInt(h.substr(i,2),16)||160);return `rgb(${Math.round(c[0]*.6)},${Math.round(c[1]*.75)},${Math.round(Math.min(255,c[2]*.92))})`};
const footMail=()=>{let m=String(az.email||"").trim();if(az.pec&&m.includes("/"))m=m.split("/").map(x=>x.trim()).filter(x=>x&&x.toLowerCase()!==String(az.pec).trim().toLowerCase()).join(" / ");return m};
const footLines=()=>({
  L:[az.piva&&["P.IVA ",az.piva],az.capsoc&&["CAP. SOC. ",az.capsoc],az.pec&&["PEC ",az.pec]].filter(Boolean),
  R:[az.sede&&["",az.sede],az.tel&&["TEL ",az.tel],footMail()&&["MAIL ",footMail()]].filter(Boolean),
  name:az.ragione||az.nome||""});
const hasFoot=()=>{const f=footLines();return !!(f.name||f.L.length||f.R.length)};
const FOOT_MM=24;
function drawFoot(pdf,n){
  const f=footLines(),W=210,y0=297-FOOT_MM+2,mx=14,hex=(az.colore||"#a4c2f4").replace("#",""),rgb=[0,2,4].map(i=>parseInt(hex.substr(i,2),16)||160);
  pdf.setPage(n);
  pdf.setTextColor(0);pdf.setFont("helvetica","bold");pdf.setFontSize(10);pdf.text(String(n),W-mx,y0+2,{align:"right"});
  pdf.setFontSize(9.5);pdf.text(f.name,mx,y0+2);
  {const k=footRgb().match(/\d+/g).map(Number);pdf.setDrawColor(k[0],k[1],k[2])}pdf.setLineWidth(0.7);pdf.line(mx,y0+4.5,W-mx,y0+4.5);
  pdf.setFontSize(7.2);
  f.L.forEach(([lab,v],i)=>{const yy=y0+9+i*3.6;pdf.setFont("helvetica","bold");pdf.text(lab,mx,yy);const w=pdf.getTextWidth(lab.trim())+1.2;pdf.setFont("helvetica","normal");pdf.text(String(v),mx+w,yy)});
  f.R.forEach(([lab,v],i)=>{const yy=y0+9+i*3.6;pdf.setFont("helvetica","normal");const w=pdf.getTextWidth(String(v));pdf.text(String(v),W-mx,yy,{align:"right"});if(lab){pdf.setFont("helvetica","bold");pdf.text(lab.trim(),W-mx-w-1.2,yy,{align:"right"})}});
}
async function makePdf(){
  if(!window.html2canvas||!window.jspdf)throw new Error("lib");
  // copia pulita del foglio, larga esattamente 210 mm, senza ombre né altezza minima
  const wrap=document.createElement("div");wrap.style.cssText="position:absolute;left:-30000px;top:0;width:210mm;background:#fff";
  const el=$("#sheet").cloneNode(true);el.querySelectorAll(".pgfoot,.pgsp").forEach(x=>x.remove());el.removeAttribute("id");el.style.cssText="box-shadow:none;margin:0;min-height:0;width:210mm";
  wrap.appendChild(el);document.body.appendChild(wrap);
  await Promise.all([...el.querySelectorAll("img")].map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r})));
  let canvas;
  try{canvas=await html2canvas(el,{scale:3,useCORS:true,backgroundColor:"#ffffff",logging:false,imageTimeout:8000,width:el.offsetWidth,height:el.offsetHeight,windowWidth:1400})}
  catch(e){wrap.remove();throw e}
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:"mm",format:"a4",compress:true});
  const W=210,H=297,top=10,k=canvas.width/el.offsetWidth,pxmm=canvas.width/W;
  // punti in cui si può andare a pagina nuova senza tagliare una riga
  const base=el.getBoundingClientRect().top;
  const cuts=[...el.querySelectorAll("tr,table,.bottom,.sign,.foot,.after,.parties,.ogg")].map(e=>Math.min(canvas.height,Math.round((e.getBoundingClientRect().bottom-base+2)*k))).sort((a,b)=>a-b);
  let y=0,page=0;
  while(y<canvas.height-4){
    const cap=Math.floor((H-(page?top:0)-(hasFoot()?FOOT_MM:0))*pxmm);let end=Math.min(canvas.height,y+cap);
    if(end<canvas.height){const ok=cuts.filter(c=>c>y+cap*0.4&&c<=end);if(ok.length)end=ok[ok.length-1]}
    const c=document.createElement("canvas");c.width=canvas.width;c.height=end-y;
    const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(canvas,0,y,canvas.width,end-y,0,0,canvas.width,end-y);
    if(page)pdf.addPage();pdf.addImage(c.toDataURL("image/jpeg",0.95),"JPEG",0,page?top:0,W,(end-y)/pxmm);
    y=end;page++;
    // salta lo spazio bianco finale
    if(canvas.height-y<6*pxmm)break;
    if(y<canvas.height){const rest=canvas.getContext("2d").getImageData(0,y,canvas.width,canvas.height-y).data;let blank=true;for(let i=0;i<rest.length;i+=64){if(rest[i]<245||rest[i+1]<245||rest[i+2]<245){blank=false;break}}if(blank)break}
  }
  wrap.remove();
  if(hasFoot()){const np=pdf.getNumberOfPages();for(let i=1;i<=np;i++)drawFoot(pdf,i)}
  pdf.setProperties({title:`Preventivo ${q.numero}`,subject:q.oggetto||"",author:az.nome||"",creator:"Preventivi"});
  const buf=pdf.output("arraybuffer");
  const json=JSON.stringify({v:1,azienda:{nome:az.nome},q});
  const b64=btoa(unescape(encodeURIComponent(json)));
  return new Blob([buf,new TextEncoder().encode("\n"+PDF_MARK+b64+"\n%%EOF\n")],{type:"application/pdf"});
}
async function savePdf(){
  const b=$("#bSave");b.disabled=true;b.textContent="Creo il PDF…";
  try{
    saveQuote(true);
    const blob=await makePdf();
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fileName();document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
    toast(`Salvato: ${fileName()}`);
  }catch(e){console.error(e);toast(e.message==="lib"?"Librerie PDF mancanti: tieni la cartella lib accanto a index.html":"PDF non creato: usa «Stampa» e scegli Salva come PDF")}
  finally{b.disabled=false;b.textContent="Salva PDF"}
}
async function openPdf(file){
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    // il blocco dati è in coda al file: cerca il marcatore negli ultimi byte
    const txt=new TextDecoder("latin1").decode(bytes.subarray(Math.max(0,bytes.length-20000000)));
    const i=txt.lastIndexOf(PDF_MARK);
    if(i<0){toast("Questo PDF non è stato creato con l'app: non contiene i dati del preventivo");return}
    const b64=txt.slice(i+PDF_MARK.length).split(/[\r\n]/)[0];
    const d=JSON.parse(decodeURIComponent(escape(atob(b64))));
    q=normalize(d.q);q.salvato=true;
    const j=archive.findIndex(a=>a.id===q.id);if(j>=0)archive[j]=JSON.parse(JSON.stringify(q));else archive.unshift(JSON.parse(JSON.stringify(q)));
    store.set("archivio",archive);store.set("bozza",q);
    const k=numOf(q.numero);if(k>=n(az.next)){az.next=k+1;store.set("azienda",az);fillCompany()}
    fillForm();show("quote");toast(`Preventivo ${q.numero} aperto: puoi modificarlo e salvarlo di nuovo`);
  }catch(e){console.error(e);toast("File non leggibile")}
}

/* ---------- cliente: ricerca dati ---------- */
function refreshClientList(){const cl=store.get("clienti",[]);$("#dlClienti").innerHTML=cl.map(c=>`<option value="${esc(c.nome)}">${esc(c.piva||"")} ${esc(c.legale||"")}</option>`).join("")}
function setClient(o,overwrite){CF.forEach(k=>{if(o[k]!=null&&o[k]!==""&&(overwrite||!q.cliente[k]))q.cliente[k]=o[k]});CF.forEach(k=>$("#c_"+k).value=q.cliente[k]??"");changed()}
$("#c_nome").addEventListener("change",()=>{const v=$("#c_nome").value.trim().toLowerCase();const c=store.get("clienti",[]).find(x=>x.nome.toLowerCase()===v);
  if(c){setClient(c,true);$("#viesMsg").textContent="Dati presi dai clienti salvati."}
  const lk=$("#lnkPiva");if(lk)lk.href="https://www.google.com/search?q="+encodeURIComponent((v||"")+" partita iva sede legale")});
const tCase=s=>s.toLowerCase().replace(/(^|[\s'(\/-])([a-zà-ù])/g,(m,a,b)=>a+b.toUpperCase());
function fmtAddr(a){const L=String(a||"").split("\n").map(x=>x.trim()).filter(Boolean);
  return L.map(l=>{const m=l.match(/^(\d{5})\s+(.+?)\s+([A-Z]{2})$/);return m?`${m[1]} ${tCase(m[2])} (${m[3]})`:tCase(l)}).join(", ")}
async function vies(piva){
  const api="https://ec.europa.eu/taxation_customs/vies/rest-api/ms/IT/vat/"+piva;
  const tries=[
    async()=>{const r=await fetch("https://r.jina.ai/"+api,{headers:{Accept:"application/json"}});const j=await r.json();return JSON.parse(j.data.content)},
    async()=>{const r=await fetch("https://corsproxy.io/?url="+encodeURIComponent(api));return r.json()},
    async()=>{const r=await fetch("https://api.allorigins.win/raw?url="+encodeURIComponent(api));return r.json()}
  ];
  for(const t of tries){try{const d=await t();if(d&&typeof d.isValid==="boolean")return d}catch(e){}}
  return null;
}
$("#bVies").onclick=async()=>{
  const piva=$("#c_piva").value.replace(/\D/g,"");const msg=$("#viesMsg");
  if(piva.length!==11){msg.textContent="La partita IVA italiana ha 11 cifre.";return}
  const saved=store.get("clienti",[]).find(x=>String(x.piva||"").replace(/\D/g,"")===piva);
  if(saved){setClient(saved,true);msg.textContent="Cliente già presente: dati presi dai clienti salvati.";return}
  const b=$("#bVies");b.disabled=true;b.textContent="Cerco…";msg.textContent="Ricerca nel registro europeo VIES…";
  const d=await vies(piva);b.disabled=false;b.textContent="Cerca dati";
  if(!d){msg.textContent="Servizio VIES non raggiungibile in questo momento: riprova tra poco o inserisci i dati a mano.";return}
  if(!d.isValid){msg.textContent="Partita IVA non trovata o non attiva nel registro VIES: controlla il numero.";return}
  const nome=(d.name||"").trim(),ind=fmtAddr(d.address);
  setClient({nome:nome&&nome!=="---"?nome:"",piva,legale:ind&&ind!=="---"?ind:""},true);
  msg.textContent="Dati trovati nel registro VIES (ragione sociale e sede legale). Completa sede esecutiva, PEC e codice SDI se servono.";
};
/* ricerca dal nome: enti pubblici (IPA), partita IVA (VIES) e, se attiva, ricerca web */
const bNome=$("#bNome");
function applyFound(r){
  const c=q.cliente,o={nome:r.nome||"",piva:r.piva||"",legale:r.indirizzo||"",sdi:r.sdi||""};
  if(r.pec&&!c.email)o.email=r.pec;
  setClient(o,true);$("#nomeRes").textContent="";
  $("#viesMsg").textContent="Dati trovati ("+r.fonte+"). Controlla che siano giusti"+" e completa sede esecutiva, referente e telefono se servono."}
async function cercaNome(){
  const msg=$("#viesMsg"),box=$("#nomeRes"),name=$("#c_nome").value.trim();box.textContent="";
  if(name.length<3){msg.textContent="Scrivi almeno 3 lettere del nome.";return}
  const saved=store.get("clienti",[]).find(x=>x.nome.toLowerCase()===name.toLowerCase());
  if(saved){setClient(saved,true);msg.textContent="Cliente già presente: dati presi dai clienti salvati.";return}
  if(!window.PREV_FN){msg.textContent="La ricerca per nome funziona dopo l'accesso nell'app (qui i dati restano solo su questo browser). Usa la partita IVA e «Cerca dati».";return}
  bNome.disabled=true;bNome.textContent="Cerco…";msg.textContent="Cerco «"+name+"»…";
  try{
    const d=await window.PREV_FN("cerca-azienda",{q:name});const R=d.risultati||[];
    if(!R.length){msg.textContent=d.nota||"Nessun risultato.";return}
    if(R.length===1&&R[0].punteggio>=0.8){applyFound(R[0]);return}
    msg.textContent="Ho trovato più risultati: tocca quello giusto.";
    R.forEach(r=>{const b=document.createElement("button");b.type="button";b.className="btn";b.style.cssText="text-align:left;white-space:normal;line-height:1.35";
      b.textContent=(r.nome||"(nome non disponibile)")+(r.piva?" · P.IVA "+r.piva:"")+(r.indirizzo?" · "+r.indirizzo:"")+" — "+r.fonte;
      b.onclick=()=>applyFound(r);box.appendChild(b)});
  }catch(e){msg.textContent="Ricerca non riuscita: "+(e&&e.message||e)}
  finally{bNome.disabled=false;bNome.textContent="🔎 Cerca"}
}
bNome.onclick=cercaNome;
$("#c_nome").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();cercaNome()}});
$("#c_piva").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("#bVies").click()}});
refreshClientList();

/* ---------- archivio ---------- */
function saveQuote(silent){
  q.salvato=true;q.aggiornato=new Date().toISOString();
  const i=archive.findIndex(a=>a.id===q.id);const copy=JSON.parse(JSON.stringify(q));
  if(i>=0)archive[i]=copy;else archive.unshift(copy);
  const k=numOf(q.numero);if(k>=n(az.next)){az.next=k+1;store.set("azienda",az);fillCompany()}
  // salva il cliente per riusarlo
  if(q.cliente.nome){const cl=store.get("clienti",[]);const j=cl.findIndex(c=>c.nome.toLowerCase()===q.cliente.nome.toLowerCase());if(j>=0)cl[j]=Object.assign({},q.cliente);else cl.push(Object.assign({},q.cliente));store.set("clienti",cl);refreshClientList()}
  if(store.set("archivio",archive)){store.set("bozza",q);if(!silent)toast("Preventivo "+q.numero+" salvato")}
}
function renderArchive(){
  const s=$("#arcSearch").value.toLowerCase();
  const ft=($("#arcTipo")||{}).value||"",fs=($("#arcStato")||{}).value||"";
  const l=archive.filter(a=>(!s||(a.numero+" "+a.cliente.nome+" "+a.oggetto).toLowerCase().includes(s))&&(!ft||(a.tipo||"lavoro")===ft)&&(!fs||statoOf(a)===fs));
  $("#arcTable").innerHTML=`<tr><th>Numero</th><th>Data</th><th>Stato</th><th>Cliente</th><th>Oggetto</th><th class="num">Totale</th><th></th></tr>`+
   (l.length?l.map(a=>`<tr data-id="${a.id}"><td style="font-family:var(--mono)">${esc(a.numero)}</td><td>${fmtDate(a.data)}</td><td>${statoBadge(a)}${a.ticket?' <span title="Ticket creato">🎫</span>':""}</td><td>${esc(a.cliente.nome)}</td><td><span class="tbadge ${a.tipo==="conn"?"conn":"lav"}">${a.tipo==="conn"?"🌐 Connessione":"🔧 Lavoro"}</span> ${esc(a.oggetto).slice(0,70)}</td><td class="num">${a.tipo==="conn"?(c=>eur.format(c.una)+" una tantum<br>"+eur.format(c.can)+" /mese")(calcConn(a)):eur.format(calc(a).tot)}</td>
   <td style="white-space:nowrap"><button class="btn small" data-a="open">Apri</button> <button class="btn small" data-a="stato">Stato</button> <button class="btn small" data-a="dup">Duplica</button>${LOGOK?' <button class="btn small" data-a="log">Storico</button>':""} <button class="btn small danger" data-a="del">Elimina</button></td></tr>`).join("")
   :`<tr><td colspan="7" class="muted">Nessun preventivo salvato. Compila un preventivo e premi «Salva».</td></tr>`);
}
$("#arcSearch").addEventListener("input",renderArchive);$("#arcTipo").addEventListener("input",renderArchive);$("#arcStato").addEventListener("input",renderArchive);
$("#arcTable").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const id=b.closest("tr").dataset.id,a=archive.find(x=>x.id===id);
  if(b.dataset.a==="open"){q=normalize(JSON.parse(JSON.stringify(a)));fillForm();show("quote")}
  else if(b.dataset.a==="stato")statoPicker(a);
  else if(b.dataset.a==="log")openLog("prevq",a.id,"Preventivo "+a.numero);
  else if(b.dataset.a==="dup"){q=normalize(JSON.parse(JSON.stringify(a)));q.id=uid();q.numero=nextNumber();q.data=today();q.salvato=false;q.rev="";q.stato="bozza";delete q.statoStoria;delete q.ticket;delete q.inviato;fillForm();show("quote");toast("Copia creata con nuovo numero "+q.numero)}
  else if(b.dataset.a==="del"){confirmBox(`Eliminare il preventivo ${esc(a.numero)}?`,()=>{archive=archive.filter(x=>x.id!==id);store.set("archivio",archive);renderArchive()})}});
$("#bBackup").onclick=()=>{const data=JSON.stringify({azienda:az,listino:catalog,archivio:archive,clienti:store.get("clienti",[])});saveFile("preventivi-backup.json",data,"application/json")};
$("#bRestore").onclick=()=>{modal(`<h3>Ripristina backup</h3><p class="hint">Incolla il testo del backup oppure scegli il file .json.</p><textarea id="rsT" class="inp" rows="8"></textarea>
  <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px"><button class="btn" id="rsF">Scegli file</button><button class="btn" data-close>Annulla</button><button class="btn primary" id="rsOk">Ripristina</button></div>`);
  $("#rsF").onclick=()=>{const f=$("#fileCsv");f.accept=".json,application/json";f.value="";f.onchange=()=>{const fr=new FileReader();fr.onload=()=>$("#rsT").value=fr.result;fr.readAsText(f.files[0])};f.click()};
  $("#rsOk").onclick=()=>{try{const d=JSON.parse($("#rsT").value);if(d.azienda)az=Object.assign({},DEF_AZ,d.azienda);if(d.listino)catalog=d.listino;if(d.archivio)archive=d.archivio;
    store.set("azienda",az);store.set("listino",catalog);store.set("archivio",archive);if(d.clienti)store.set("clienti",d.clienti);closeModal();fillCompany();renderArchive();renderSheet();toast("Backup ripristinato")}catch(e){toast("Testo non valido: incolla l'intero contenuto del backup")}}};
$("#bPickClient").onclick=()=>{const cl=store.get("clienti",[]);
  modal(`<h3>Clienti salvati</h3>${cl.length?cl.map((c,i)=>`<div class="picker-item" data-i="${i}"><div><b>${esc(c.nome)}</b><br><span class="muted">${esc(c.piva)} · ${esc(c.legale)}</span></div></div>`).join(""):`<p class="muted">I clienti vengono memorizzati quando salvi un preventivo.</p>`}
   <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Chiudi</button></div>`);
  $(".modal").onclick=e=>{const it=e.target.closest(".picker-item");if(!it)return;q.cliente=Object.assign({},cl[+it.dataset.i]);CF.forEach(k=>$("#c_"+k).value=q.cliente[k]??"");closeModal();changed()}};

/* ---------- azienda ---------- */
const AF=["forn","nome","piva","cf","sede","oper","tel","email","web","iban","colore","formato","pref","next","foot","cond","note","pag","iva","ragione","capsoc","pec"];
function fillCompany(){AF.forEach(k=>$("#a_"+k).value=az[k]??"");$("#logoPrev").innerHTML=az.logo?`<img src="${esc(az.logo)}" alt="Logo">`:"Nessun logo";$("#brandAz").textContent=az.nome?"· "+az.nome:""}
AF.forEach(k=>$("#a_"+k).addEventListener("input",e=>{az[k]=e.target.value;store.set("azienda",az);if(k==="forn"&&az.forn==="si"){store.set("listinoFornVer","");applyForn();renderCatalog();toast("Listino fornitori aggiunto")}$("#brandAz").textContent=az.nome?"· "+az.nome:"";renderSheet()}));
$("#bLogo").onclick=()=>{const f=$("#fileLogo");f.value="";f.onchange=async()=>{if(!f.files[0])return;az.logo=await resizeFile(f.files[0],1200);store.set("azienda",az);fillCompany();renderSheet();toast("Logo caricato")};f.click()};
$("#bLogoDel").onclick=()=>{az.logo="";store.set("azienda",az);fillCompany();renderSheet()};

/* ---------- utilità UI ---------- */
function modal(html){$("#modalRoot").innerHTML=`<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#modalRoot .modal-bg").addEventListener("click",e=>{if(e.target.classList.contains("modal-bg")||e.target.closest("[data-close]"))closeModal()})}
function closeModal(){$("#modalRoot").innerHTML="";pasteHandler=null}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
function confirmBox(msg,ok){modal(`<h3>${msg}</h3><div style="display:flex;gap:6px;justify-content:flex-end"><button class="btn" data-close>Annulla</button><button class="btn primary" id="cfOk">Conferma</button></div>`);$("#cfOk").onclick=()=>{closeModal();ok()}}
let tT;function toast(m){let t=$(".toast");if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(tT);tT=setTimeout(()=>t.hidden=true,2800)}
function saveFile(name,text,type){
  try{const blob=new Blob(["﻿"+text],{type:type+";charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){}
  // in alcuni ambienti il download è bloccato: mostra anche il testo da copiare
  modal(`<h3>${esc(name)}</h3><p class="hint">Se il download non è partito, copia il testo e salvalo in un file (anche su Google Drive).</p><textarea class="inp" rows="10" id="sfT" readonly>${esc(text)}</textarea>
   <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px"><button class="btn" id="sfC">Copia</button><button class="btn primary" data-close>Fatto</button></div>`);
  $("#sfC").onclick=()=>{const t=$("#sfT");navigator.clipboard?.writeText(t.value).then(()=>toast("Copiato"),()=>{t.select();toast("Testo selezionato: premi Ctrl+C")})||(t.select())};
}
function show(v){$$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));$$(".view").forEach(s=>s.hidden=s.id!=="v-"+v);$("#quoteActions").style.visibility=v==="quote"?"visible":"hidden";
  if(v==="catalog")renderCatalog();if(v==="archive"){renderArchive();reloadArchive()}if(v==="log")loadLog(true)}
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button");if(b)show(b.dataset.v)});

$("#bSave").onclick=()=>savePdf();
$("#bOpen").onclick=()=>{$("#filePdf").value="";$("#filePdf").click()};
$("#filePdf").addEventListener("change",e=>{const f=e.target.files[0];if(f)openPdf(f)});
$("#bNew").onclick=()=>{modal(`<h3>Nuovo preventivo</h3><p class="hint">Le modifiche non salvate di quello attuale andranno perse. Che tipo di preventivo vuoi fare?</p>
  <div style="display:grid;gap:8px"><button class="btn primary" id="nvLav">🔧 Lavoro: installazione, prodotti e manodopera</button><button class="btn primary" id="nvCon">🌐 Connessione: abbonamento servizi (una tantum + canone mensile)</button><button class="btn" data-close>Annulla</button></div>`);
  const go=tipo=>{closeModal();q=newQuote(false);q.tipo=tipo;normalize(q);store.set("bozza",q);fillForm();toast("Nuovo preventivo "+q.numero)};
  $("#nvLav").onclick=()=>go("lavoro");$("#nvCon").onclick=()=>go("conn")};
$("#bPrint").onclick=()=>{const old=document.title;document.title=`Preventivo ${q.numero} ${q.cliente.nome}`.replace(/[\/\\:]/g,"-");window.print();setTimeout(()=>document.title=old,1000)};

/* ---------- stato, ticket, invio per email, storico, modifiche di altri admin ---------- */
const REMOTE=!!store.remote,LOGOK=REMOTE;
const nowIso=()=>new Date().toISOString();
const fmtDT=iso=>{try{return new Date(iso).toLocaleString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return String(iso||"")}};
function statoBadge(a){const s=statoOf(a);return `<span class="sbadge ${s}">${STATI[s]}</span>`}
if(LOGOK)$("#tabLog").hidden=false;

/* un altro admin ha cambiato listino, clienti o dati azienda: le modifiche sono state unite */
window.PREV_ON_REMOTE=(k,v,conf)=>{
  if(k==="listino"){catalog=v;if(!$("#v-catalog").hidden)renderCatalog()}
  else if(k==="clienti")refreshClientList();
  else if(k==="azienda"){az=Object.assign({},DEF_AZ,v);if(az.forn!=="si"&&az.forn!=="no")az.forn=store.get("listinoFornVer","")?"si":"no";fillCompany();renderSheet()}
  const what={listino:"listino",clienti:"anagrafica clienti",azienda:"dati azienda"}[k]||k;
  toast(conf&&conf.length?`Un altro admin aveva cambiato le stesse voci del ${what}: ho tenuto le tue. Le sue restano nello Storico.`:`Ho unito le modifiche fatte da un altro admin al ${what}`)};

/* --- stato --- */
function setStato(a,s,extra){if(!STATI[s]||s==="scaduto")return;const was=a.stato||"bozza";if(was!==s){a.stato=s;(a.statoStoria=a.statoStoria||[]).push({s,at:nowIso()})}if(extra)Object.assign(a,extra)}
// cambia stato a un preventivo dell'archivio senza toccare le modifiche non salvate di quello aperto
function applyStato(id,s,extra){
  const a=archive.find(x=>x.id===id);
  if(a){setStato(a,s,extra);a.aggiornato=nowIso();store.set("archivio",archive)}
  if(q.id===id){setStato(q,s,extra);store.set("bozza",q);fillStato()}
  if(!$("#v-archive").hidden)renderArchive()}
function fillStato(){
  const sel=$("#q_stato");if(!sel)return;sel.value=STATI[q.stato]?q.stato:"bozza";
  const st=statoOf(q),sc=scadenzaOf(q),last=(q.statoStoria||[]).slice(-1)[0];let t="";
  if(st==="scaduto")t="⌛ Scaduto il "+fmtDate(sc);
  else if(last&&last.s===q.stato)t="dal "+fmtDT(last.at);
  if((q.stato==="bozza"||q.stato==="inviato")&&sc&&st!=="scaduto")t+=(t?" · ":"")+"valido fino al "+fmtDate(sc);
  if(q.inviato&&q.inviato.at)t+=(t?" · ":"")+"inviato "+fmtDT(q.inviato.at)+(q.inviato.a?" a "+q.inviato.a:"");
  $("#statoInfo").textContent=t;
  const bt=$("#bTicket");bt.hidden=!(REMOTE&&q.stato==="accettato");bt.textContent=q.ticket?"🎫 Ticket creato":"🎫 Crea ticket"}
$("#q_stato").addEventListener("change",e=>{const v=e.target.value;setStato(q,v);saveQuote(true);fillStato();
  if(v==="accettato"&&REMOTE&&!q.ticket)toast("Accettato! Ora puoi creare il ticket per il lavoro")});
$("#bTicket").onclick=()=>{if(!q.salvato)saveQuote(true);ticketModal(archive.find(x=>x.id===q.id)||q)};
function statoPicker(a){
  modal(`<h3>Stato del preventivo ${esc(a.numero)}</h3><p class="hint">${esc(a.cliente.nome||"")} · ora: ${statoBadge(a)}</p>
   <div style="display:grid;gap:8px;margin-top:8px">${["bozza","inviato","accettato","rifiutato"].map(s=>`<button class="btn${(a.stato||"bozza")===s?" primary":""}" data-s="${s}">${STATI[s]}</button>`).join("")}
   ${REMOTE&&a.stato==="accettato"?`<button class="btn" id="spTix">${a.ticket?"🎫 Ticket già creato: creane un altro":"🎫 Crea ticket"}</button>`:""}
   <button class="btn" data-close>Chiudi</button></div>`);
  $$(".modal [data-s]").forEach(b=>b.onclick=()=>{const s=b.dataset.s;closeModal();applyStato(a.id,s);toast(`Preventivo ${a.numero}: ${STATI[s]}`);
    if(s==="accettato"&&REMOTE&&!a.ticket)setTimeout(()=>statoPicker(a),50)});
  const t=$("#spTix");if(t)t.onclick=()=>ticketModal(a)}

/* --- dal preventivo al ticket --- */
let TEAM=null;
async function loadTeam(){
  if(TEAM)return TEAM;
  const [p,g]=await Promise.all([store.sb.from("profiles").select("id,name,email,active,role"),store.sb.from("docs").select("id,data").eq("coll","groups")]);
  if(p.error)throw p.error;
  TEAM={users:(p.data||[]).filter(u=>u.active!==false).sort((x,y)=>(x.name||x.email).localeCompare(y.name||y.email)),groups:((g&&g.data)||[]).map(d=>Object.assign({},d.data,{id:d.id})).sort((x,y)=>String(x.name||"").localeCompare(String(y.name||"")))};
  return TEAM}
function ticketDesc(a){
  const c=a.cliente||{},L=[`Preventivo ${a.numero} del ${fmtDate(a.data)}`+(a.oggetto?` – ${a.oggetto}`:""),"",`Cliente: ${c.nome||""}`];
  const sede=c.esecutiva||c.legale;if(sede)L.push(`Indirizzo: ${sede}`);if(c.ref)L.push(`Referente: ${c.ref}`);if(c.tel)L.push(`Telefono: ${c.tel}`);
  const rows=a.tipo==="conn"?(a.conn||[]).filter(r=>r.titolo).map(r=>`- ${num.format(n(r.qta)||1)} × ${r.titolo}`):(a.righe||[]).map(r=>`- ${num.format(n(r.qta))} ${r.um||""} ${lbl(r)}`.replace(/\s+/g," "));
  if(rows.length)L.push("",a.tipo==="conn"?"Servizi:":"Lavori e materiali:",...rows);
  if(a.tempi)L.push("","Tempi: "+a.tempi);
  return L.join("\n")}
async function ticketModal(a){
  if(!REMOTE)return toast("I ticket si creano solo con l'accesso all'app");
  let T;try{T=await loadTeam()}catch(e){return toast("Non riesco a leggere il team: "+(e.message||e))}
  const c=a.cliente||{},title=((c.nome||"Cliente")+" – "+(a.oggetto||"preventivo "+a.numero)).replace(/\s+/g," ").slice(0,110);
  const opt=(v,l,sel)=>`<option value="${v}"${sel?" selected":""}>${l}</option>`;
  modal(`<h3>🎫 Nuovo ticket dal preventivo ${esc(a.numero)}</h3>
   ${a.ticket?`<p class="hint">Per questo preventivo hai già creato un ticket il ${fmtDT(a.ticket.at)}.</p>`:""}
   <div class="grid">
    <label class="f full">Titolo<input id="tkT" value="${esc(title)}"></label>
    <label class="f full">Descrizione<textarea id="tkD" rows="8">${esc(ticketDesc(a))}</textarea></label>
    <label class="f">Data intervento<input id="tkDue" type="date"></label>
    <label class="f">Ora<input id="tkTime" type="time"></label>
    <label class="f">Durata<select id="tkDur">${opt(30,"30 minuti")}${opt(60,"1 ora",1)}${opt(90,"1 ora e 30")}${opt(120,"2 ore")}${opt(180,"3 ore")}${opt(240,"4 ore")}</select></label>
    <label class="f">Urgenza<select id="tkPr">${opt("urgente","Urgente")}${opt("alta","Alta")}${opt("normale","Normale",1)}${opt("bassa","Bassa")}</select></label>
    <div class="full" style="font-size:12px;color:var(--muted)">Assegna a
     <div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:4px;color:var(--ink);font-size:13.5px">
      ${T.groups.map(g=>`<label><input type="checkbox" data-g="${esc(g.id)}"> 👥 ${esc(g.name||"Gruppo")}</label>`).join("")}
      ${T.users.map(u=>`<label><input type="checkbox" data-u="${esc(u.id)}"> ${esc(u.name||u.email)}</label>`).join("")}
     </div></div>
   </div>
   <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Annulla</button><button class="btn primary" id="tkOk">Crea ticket</button></div>`);
  $("#tkOk").onclick=async()=>{
    const t=$("#tkT").value.trim();if(!t)return toast("Inserisci un titolo");
    const au=$$(".modal [data-u]").filter(x=>x.checked).map(x=>x.dataset.u),ag=$$(".modal [data-g]").filter(x=>x.checked).map(x=>x.dataset.g);
    const set=new Set(au);ag.forEach(id=>{const g=T.groups.find(x=>x.id===id);(g&&g.members||[]).forEach(m=>{if(T.users.some(u=>u.id===m))set.add(m)})});
    const data={title:t,desc:$("#tkD").value,due:$("#tkDue").value,status:"Fare",photo:"",time:$("#tkTime").value,dur:+$("#tkDur").value,rem:60,prio:$("#tkPr").value,doneAt:0,
      assignUsers:au,groups:ag,gnames:ag.map(id=>(T.groups.find(x=>x.id===id)||{}).name).filter(Boolean),assignees:[...set],
      uid:store.uid,created:Date.now(),preventivo:{id:a.id,numero:a.numero}};
    const id=(crypto.randomUUID&&crypto.randomUUID())||uid()+uid(),b=$("#tkOk");b.disabled=true;b.textContent="Creo…";
    const r=await store.sb.from("docs").insert({coll:"tix",id,data});
    if(r.error){b.disabled=false;b.textContent="Crea ticket";return toast("Ticket non creato: "+r.error.message)}
    closeModal();applyStato(a.id,"accettato",{ticket:{id,at:nowIso(),title:t}});
    toast(set.size?`Ticket creato e assegnato (${set.size} ${set.size===1?"persona":"persone"} avvisate)`:"Ticket creato: lo trovi nell'app, sezione Ticket")}}

/* --- invio per email: gratis, con le app di posta del dispositivo --- */
const canShareFiles=(()=>{try{return !!(navigator.canShare&&navigator.share&&navigator.canShare({files:[new File(["x"],"p.pdf",{type:"application/pdf"})]}))}catch(e){return false}})();
$("#bMail").onclick=async()=>{
  saveQuote(true);
  const c=q.cliente||{},sub=`Preventivo n. ${q.numero}${q.oggetto?" – "+q.oggetto.split("\n")[0]:""}`.slice(0,150);
  const body=`Gentile ${c.ref||c.nome||"cliente"},\n\nin allegato il nostro preventivo n. ${q.numero} del ${fmtDate(q.data)}${q.oggetto?" relativo a: "+q.oggetto.replace(/\s+/g," "):""}.\n${n(q.validita)?`L'offerta è valida ${n(q.validita)} giorni.\n`:""}\nRestiamo a disposizione per qualsiasi chiarimento.\n\nCordiali saluti\n${az.nome||""}${az.tel?"\n"+az.tel:""}${az.email?"\n"+az.email:""}`;
  modal(`<h3>✉️ Invia il preventivo ${esc(q.numero)}</h3>
   <div class="grid">
    <label class="f full">A (email del cliente)<input id="mTo" type="email" value="${esc(c.email||"")}" placeholder="nome@cliente.it"></label>
    <label class="f full">Oggetto<input id="mSub" value="${esc(sub)}"></label>
    <label class="f full">Testo<textarea id="mBody" rows="9">${esc(body)}</textarea></label>
   </div>
   <p class="hint" id="mSt">Preparo il PDF…</p>
   <div style="display:grid;gap:8px;margin-top:10px">
    ${canShareFiles?`<button class="btn primary" id="mShare" disabled>📤 Condividi il PDF (Gmail, Outlook, WhatsApp…)</button>`:""}
    <button class="btn${canShareFiles?"":" primary"}" id="mMail" disabled>✉️ Apri il programma di posta${canShareFiles?"":" (il PDF si scarica: trascinalo nella email)"}</button>
    <button class="btn" data-close>Annulla</button></div>`);
  let blob=null;
  try{blob=await makePdf();$("#mSt")&&($("#mSt").textContent=canShareFiles?"PDF pronto. «Condividi» lo allega da solo; con «Apri il programma di posta» il PDF si scarica e va allegato a mano.":"PDF pronto. Il programma di posta si apre con testo già scritto: il PDF si scarica e va trascinato nella email (un link email non può allegare file da solo).")}
  catch(e){console.error(e);if($("#mSt"))$("#mSt").textContent="PDF non creato: usa «Salva PDF» e allegalo a mano.";}
  if(!$("#mMail"))return;   // finestra chiusa nel frattempo
  const sent=via=>{const to=$("#mTo").value.trim();closeModal();
    applyStato(q.id,q.stato==="bozza"||!q.stato?"inviato":q.stato,{inviato:{at:nowIso(),a:to,via}});
    toast(q.stato==="inviato"?"Preventivo segnato come Inviato":"Invio registrato")};
  $("#mMail").disabled=false;
  $("#mMail").onclick=()=>{
    if(blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fileName();document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
    const to=$("#mTo").value.trim(),u=`mailto:${encodeURIComponent(to).replace(/%40/g,"@")}?subject=${encodeURIComponent($("#mSub").value)}&body=${encodeURIComponent($("#mBody").value)}`;
    setTimeout(()=>{location.href=u},blob?600:0);sent("email")};
  const sh=$("#mShare");if(sh&&blob){sh.disabled=false;sh.onclick=async()=>{
    try{await navigator.share({files:[new File([blob],fileName(),{type:"application/pdf"})],title:$("#mSub").value,text:$("#mBody").value});sent("condivisione")}
    catch(e){if(e&&e.name!=="AbortError")toast("Condivisione non riuscita: usa «Apri il programma di posta»")}}}
};

/* --- archivio aggiornato con i preventivi e gli stati cambiati da altri admin --- */
let arcT=0;
async function reloadArchive(){if(!store.reloadArchive||Date.now()-arcT<20000)return;arcT=Date.now();
  try{archive=await store.reloadArchive();if(!$("#v-archive").hidden)renderArchive()}catch(e){console.warn(e)}}

/* --- storico modifiche (tabella prev_log, scritta dal database) --- */
const FL={numero:"Numero",data:"Data",validita:"Validità (giorni)",rev:"Revisione",oggetto:"Oggetto",stato:"Stato",tipo:"Tipo",righe:"Riga",conn:"Servizio",voip:"Tariffa VoIP",
  sconto:"Sconto",scontoTipo:"Tipo sconto",iva:"IVA %",arr:"Arrotondamento",note:"Note",pag:"Pagamento",tempi:"Tempi",cond:"Condizioni",cliente:"Cliente",titoloTab:"Titolo tabella",
  nome:"Nome",piva:"P.IVA",cf:"Cod. fiscale",legale:"Sede legale",esecutiva:"Sede esecutiva",ref:"Referente",tel:"Telefono",email:"Email",sdi:"SDI",pec:"PEC",
  prezzo:"Prezzo",qta:"Quantità",titolo:"Titolo",descr:"Descrizione",codice:"Codice",um:"Unità",pers:"Persone",omaggio:"Omaggio",costo:"Costo",img:"Foto",link:"Link",cat:"Categoria",
  una:"Una tantum",can:"Canone",label:"Voce",dett:"Dettaglio",ticket:"Ticket",logo:"Logo",next:"Prossimo numero",pref:"Prefisso",sede:"Sede",web:"Sito",iban:"IBAN",ragione:"Ragione sociale",
  _listino:"Voce del listino",_clienti:"Cliente",layout:"Modello",show:"Mostra",showImg:"Foto nel PDF",showListino:"Prezzi di listino",dataTab:"Data in tabella",totIva:"Totale IVA"};
const LOG_SKIP=new Set(["statoStoria","salvato","aggiornato","inviato","listinoFornVer","id"]);
const fv=(k,v)=>{if(v==null||v==="")return"(vuoto)";if(k==="stato")return STATI[v]||v;if(/^\d{4}-\d\d-\d\d$/.test(v))return fmtDate(v);if(typeof v==="boolean")return v?"sì":"no";
  if(typeof v==="object")return k==="ticket"?"creato":"…";const s=String(v).replace(/\s+/g," ");return s.length>70?s.slice(0,69)+"…":s};
const FEM=/(Riga|Voce|Tariffa)$/;
const itemName=x=>x?String(x.nome||x.label||lbl(x)||""):"";
function diffLines(d,path,out){
  Object.keys(d||{}).forEach(k=>{if(LOG_SKIP.has(k))return;const v=d[k],L=(path?path+" · ":"")+(FL[k]||k);
    if(v&&Array.isArray(v["~"])){const[a,b]=v["~"];
      if(a==="ordine"&&b==="ordine")out.push(`${esc(L)}: cambiato l'ordine`);else if(k==="img"||k==="logo")out.push(`${esc(L)}: cambiata`);
      else out.push(`${esc(L)}: ${esc(fv(k,a))} → <b>${esc(fv(k,b))}</b>`)}
    else if(v&&Array.isArray(v["#"]))v["#"].forEach(it=>{const nm=esc(itemName(it.to||it.from)||it.k);
      if(!it.from)out.push(`➕ ${esc(L)} «${nm}» aggiunta`.replace(/a$/,FEM.test(L)?"a":"o"));else if(!it.to)out.push(`➖ ${esc(L)} «${nm}» tolt`+(FEM.test(L)?"a":"o"));
      else{const ch=Object.keys(Object.assign({},it.from,it.to)).filter(f=>f!=="id"&&JSON.stringify(it.from[f])!==JSON.stringify(it.to[f]));
        out.push(`${esc(L)} «${nm}»: `+(ch.length?ch.map(f=>`${esc(FL[f]||f)} ${esc(fv(f,it.from[f]))} → <b>${esc(fv(f,it.to[f]))}</b>`).join(", "):"cambiata la foto"))}});
    else if(v&&typeof v==="object")diffLines(v,L,out)});
  return out}
const LOG={coll:"",doc:"",label:"",from:0,users:null,rows:{}};
function openLog(coll,doc,label){LOG.doc=doc||"";LOG.label=label||"";$("#logFilter").value=coll==="prevq"?"prevq":"";show("log")}
function logItem(e){
  LOG.rows[e.id]=e;
  const who=e.by_user?(LOG.users[e.by_user]||"utente non più presente"):"sistema",i=e.info||{};
  let what,lines;
  if(e.coll==="prevq"){what=`Preventivo <b>${esc(i.numero||"")}</b>${i.cliente?" · "+esc(i.cliente):""}`;
    lines=e.action==="insert"?["creato"]:e.action==="delete"?[`eliminato <button class="btn small" data-rest="${e.id}">Recupera</button>`]:diffLines(e.changes,"",[])}
  else{what=`<b>${{listino:"Listino",clienti:"Clienti",azienda:"Dati azienda"}[e.doc_id]||esc(e.doc_id)}</b>`;
    const d=e.changes&&e.changes.v;
    lines=e.action!=="update"?[e.action==="insert"?"creato":"eliminato"]:d&&(d["#"]||d["~"])&&e.doc_id!=="azienda"?diffLines({["_"+e.doc_id]:d},"",[]):diffLines(d,"",[])}
  if(!lines.length)lines=["nessuna differenza visibile"];
  const more=lines.length>15?`<li class="muted">… e altre ${lines.length-15} modifiche</li>`:"";
  return `<div class="log-item"><div class="log-head"><span class="muted" style="font-family:var(--mono);font-size:12.5px">${fmtDT(e.at)}</span><span>👤 ${esc(who)}</span><span>${what}</span></div><ul>${lines.slice(0,15).map(l=>`<li>${l}</li>`).join("")}${more}</ul></div>`}
async function loadLog(reset){
  if(!LOGOK)return;const box=$("#logList");if(reset){LOG.from=0;LOG.rows={};box.innerHTML='<p class="muted">Carico…</p>'}
  $("#logDoc").innerHTML=LOG.doc?`<span class="sbadge">${esc(LOG.label)}</span> <button class="btn small" id="logAll">Mostra tutto</button>`:"";
  if(LOG.doc)$("#logAll").onclick=()=>{LOG.doc="";loadLog(true)};
  try{
    if(!LOG.users){const r=await store.sb.from("profiles").select("id,name,email");LOG.users={};(r.data||[]).forEach(u=>LOG.users[u.id]=u.name||u.email)}
    const f=$("#logFilter").value;let qy=store.sb.from("prev_log").select("*").order("at",{ascending:false}).order("id",{ascending:false}).range(LOG.from,LOG.from+49);
    if(LOG.doc)qy=qy.eq("coll","prevq").eq("doc_id",LOG.doc);else if(f==="prevq")qy=qy.eq("coll","prevq");else if(f)qy=qy.eq("coll","prev").eq("doc_id",f);
    const r=await qy;if(r.error)throw r.error;
    if(reset)box.innerHTML=r.data.length?"":'<p class="muted">Nessuna modifica registrata finora.</p>';
    r.data.forEach(e=>box.insertAdjacentHTML("beforeend",logItem(e)));
    LOG.from+=r.data.length;$("#logMore").hidden=r.data.length<50;
  }catch(e){const m=String(e&&e.message||e);box.innerHTML=`<p class="muted">${/prev_log/.test(m)?"Lo storico non è ancora attivo: va eseguito su Supabase il file SQL del passo 3 (step3-preventivi.sql).":"Storico non disponibile: "+esc(m)}</p>`}}
$("#logFilter").addEventListener("change",()=>{LOG.doc="";loadLog(true)});
$("#logReload").onclick=()=>loadLog(true);$("#logMore").onclick=()=>loadLog(false);
// un preventivo eliminato si può recuperare dallo storico (senza le immagini, che non vengono conservate)
$("#logList").addEventListener("click",e=>{const b=e.target.closest("[data-rest]");if(!b)return;const row=LOG.rows[b.dataset.rest];if(!row||!row.changes)return;
  const d=JSON.parse(JSON.stringify(row.changes,(k,v)=>v==="[immagine]"?"":v));
  if(archive.some(a=>a.id===d.id))return toast("Questo preventivo è già nell'archivio");
  confirmBox(`Recuperare il preventivo ${esc(d.numero||"")}? Torna nell'archivio senza le immagini.`,()=>{normalize(d);d.salvato=true;d.aggiornato=nowIso();archive.unshift(d);store.set("archivio",archive);toast("Preventivo "+d.numero+" recuperato: lo trovi nell'Archivio")})});

fillCompany();fillForm();
})();
